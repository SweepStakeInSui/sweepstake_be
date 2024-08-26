import { OrderEntity } from '@models/entities/order.entity';
import { log } from 'console';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { OrderProcessor } from '../order-processor';
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
        log('MatchingEngineService constructor');
        this.logger = this.loggerService.getLogger(MatchingEngineService.name);
        this.configService = configService;

        this.orderProcessors = new Map();

        // Add some orders to the book
        // this.addOrder(
        //     this.orderRepository.create({
        //         id: '1',
        //         outcomeId: '01917032-cd3b-7cc2-8416-977ab4763c6e',
        //         side: OrderSide.Bid,
        //         price: 400n,
        //         amount: 10n,
        //     }),
        // );
        // this.addOrder(
        //     this.orderRepository.create({
        //         id: '2',
        //         outcomeId: '01917032-cd3b-7cc2-8416-977ab4763c6e',
        //         side: OrderSide.Bid,
        //         price: 600n,
        //         amount: 10n,
        //     }),
        // );
        // this.addOrder(
        //     this.orderRepository.create({
        //         id: '3',
        //         outcomeId: '01917032-cd3b-7cc2-8416-991186a6c821',
        //         side: OrderSide.Bid,
        //         price: 600n,
        //         amount: 10n,
        //     }),
        // );
        // this.addOrder(
        //     this.orderRepository.create({
        //         id: '4',
        //         outcomeId: '01917032-cd3b-7cc2-8416-991186a6c821',
        //         side: OrderSide.Ask,
        //         price: 95n,
        //         amount: 5n,
        //     }),
        // );
    }

    private orderProcessors: Map<string, OrderProcessor>;

    private getProcessor(marketId: string) {
        let processor = this.orderProcessors.get(marketId);

        if (!processor) {
            processor = new OrderProcessor(marketId);
            this.orderProcessors.set(marketId, processor);
        }

        return processor;
    }

    async addOrder(order: OrderEntity) {
        const outcomeInfo = await this.outcomeRepository.findOne({
            where: { id: order.outcomeId },
            relations: ['market'],
        });
        const marketInfo = outcomeInfo.market;

        order.outcome = outcomeInfo;

        const processor = this.getProcessor(marketInfo.id);
        processor.addOrder(order);

        log('added order', order.id, order.side, order.outcome.type, order.price, order.amount);
    }
}
