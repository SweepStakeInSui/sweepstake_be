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
        let processor = this.orderBooks.get(marketId);

        if (!processor) {
            processor = new OrderBook(marketId);
            this.orderBooks.set(marketId, processor);
        }

        return processor;
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
        orderBook.matchOrder(order);
    }
}
