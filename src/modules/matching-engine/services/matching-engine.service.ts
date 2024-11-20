import { OrderEntity } from '@models/entities/order.entity';
import { log } from 'console';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { OrderBook } from '../order-book';
import { MarketRepository } from '@models/repositories/market.repository';
import { OrderRepository } from '@models/repositories/order.repository';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { Injectable } from '@nestjs/common';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { OrderSide, OrderStatus, OrderType } from '@modules/order/types/order';
import { OutcomeType } from '@modules/market/types/outcome';
import { EEnvKey } from '@constants/env.constant';
// import { BigIntUtil } from '@shared/utils/bigint';

export interface Trade {
    maker: OrderEntity;
    taker: OrderEntity;
    amount: bigint;
}

@Injectable()
export class MatchingEngineService {
    protected logger: Logger;
    protected configService: ConfigService;
    private readonly unit: bigint;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        private readonly kafkaProducer: KafkaProducerService,

        private marketRepository: MarketRepository,
        private outcomeRepository: OutcomeRepository,
        private orderRepository: OrderRepository,
    ) {
        this.logger = this.loggerService.getLogger(MatchingEngineService.name);
        this.configService = configService;
        this.unit = 10n ** BigInt(this.configService.get(EEnvKey.DECIMALS));

        this.orderBooks = new Map();

        this.init();
    }

    private orderBooks: Map<string, OrderBook>;

    private getOrderBookInner(marketId: string) {
        let orderBook = this.orderBooks.get(marketId);

        if (!orderBook) {
            orderBook = new OrderBook(marketId, BigInt(this.configService.get(EEnvKey.DECIMALS)));
            this.orderBooks.set(marketId, orderBook);
        }

        return orderBook;
    }

    async init() {
        const orders = await this.orderRepository.find({
            where: {
                status: OrderStatus.Pending,
            },
            relations: ['outcome'],
        });
        for (const order of orders) {
            await this.matchOrder(order);
        }
    }

    async getOrderBook(marketId: string) {
        return this.getOrderBookInner(marketId).getOrderBook();
    }

    async matchOrder(order: OrderEntity) {
        log('matching order', order.id, order.side, order.outcome.type, order.price, order.amount);
        const outcomeInfo = await this.outcomeRepository.findOne({
            where: { id: order.outcomeId },
            relations: ['market'],
        });
        const marketInfo = outcomeInfo.market;

        order.outcome = outcomeInfo;

        const orderBook = this.getOrderBookInner(marketInfo.id);
        const matches = orderBook.matchOrder(order);
        const orderbookPrice = orderBook.getPrice();
        const oppositeOutcomeInfo = await this.outcomeRepository.findOne({
            where: {
                marketId: marketInfo.id,
                type: outcomeInfo.type == OutcomeType.Yes ? OutcomeType.No : OutcomeType.Yes,
            },
        });

        outcomeInfo.askPrice = orderbookPrice[`${OrderSide.Ask}-${outcomeInfo.type}`];
        outcomeInfo.bidPrice = orderbookPrice[`${OrderSide.Bid}-${outcomeInfo.type}`];
        oppositeOutcomeInfo.askPrice = orderbookPrice[`${OrderSide.Ask}-${oppositeOutcomeInfo.type}`];
        oppositeOutcomeInfo.bidPrice = orderbookPrice[`${OrderSide.Bid}-${oppositeOutcomeInfo.type}`];

        console.log(
            outcomeInfo.askPrice,
            outcomeInfo.bidPrice,
            oppositeOutcomeInfo.askPrice,
            oppositeOutcomeInfo.bidPrice,
        );

        await this.outcomeRepository.save([outcomeInfo, oppositeOutcomeInfo]);

        marketInfo.percentage =
            outcomeInfo.type == OutcomeType.Yes
                ? (outcomeInfo.askPrice - outcomeInfo.bidPrice) / 2n + outcomeInfo.bidPrice
                : (oppositeOutcomeInfo.askPrice - oppositeOutcomeInfo.bidPrice) / 2n + oppositeOutcomeInfo.bidPrice;

        await this.marketRepository.save(marketInfo);

        if (matches.matchedOrders.length == 0) {
            if (order.type == OrderType.FOK) {
                order.status = OrderStatus.Cancelled;
                await this.orderRepository.save(order);
            }
            return;
        }

        const msgMetadata = await this.kafkaProducer.produce({
            topic: KafkaTopic.EXECUTE_TRADE,
            messages: [
                {
                    value: JSON.stringify(matches),
                },
            ],
        });
        console.log('matches', msgMetadata);
    }

    async cancelOrer(order: OrderEntity) {
        log('cancel order', order.id);
        const outcomeInfo = await this.outcomeRepository.findOne({
            where: { id: order.outcomeId },
            relations: ['market'],
        });
        const marketInfo = outcomeInfo.market;

        order.outcome = outcomeInfo;

        const orderBook = this.getOrderBookInner(marketInfo.id);
        orderBook.cancelOrder(order);
    }
}
