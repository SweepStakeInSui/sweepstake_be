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
import { Inject, Injectable } from '@nestjs/common';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

export interface Trade {
    maker: OrderEntity;
    taker: OrderEntity;
    amount: bigint;
}

@Injectable()
export class MatchingEngineService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
        @Inject()
        private readonly kafkaProducer: KafkaProducerService,

        private marketRepository: MarketRepository,
        private outcomeRepository: OutcomeRepository,
        private orderRepository: OrderRepository,
    ) {
        this.logger = this.loggerService.getLogger(MatchingEngineService.name);
        this.configService = configService;

        this.orderBooks = new Map();
    }

    private orderBooks: Map<string, OrderBook>;

    private getOrderBook(marketId: string) {
        let orderBook = this.orderBooks.get(marketId);

        if (!orderBook) {
            orderBook = new OrderBook(marketId);
            this.orderBooks.set(marketId, orderBook);
        }

        return orderBook;
    }

    async matchOrder(order: OrderEntity) {
        log('matching order', order.id, order.side, order.outcome.type, order.price, order.amount);
        const outcomeInfo = await this.outcomeRepository.findOne({
            where: { id: order.outcomeId },
            relations: ['market'],
        });
        const marketInfo = outcomeInfo.market;

        order.outcome = outcomeInfo;

        const orderBook = this.getOrderBook(marketInfo.id);
        const matches = orderBook.matchOrder(order);
        if (matches.matchedOrders.length == 0) {
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

        const orderBook = this.getOrderBook(marketInfo.id);
        orderBook.cancelOrder(order);
    }
}
