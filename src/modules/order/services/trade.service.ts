import { TradeRepository } from '@models/repositories/trade.repository';
import { Match } from '@modules/matching-engine/order-book';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { map } from 'lodash';
import { Logger } from 'log4js';
import { OrderStatus } from '../types/order';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

export class TradeService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly kafkaProducer: KafkaProducerService,

        private readonly tradeRepository: TradeRepository,
    ) {
        this.logger = this.loggerService.getLogger(TradeService.name);
        this.configService = configService;
    }

    public async executeTrade(matches: Match) {
        const order = matches.order;

        await this.tradeRepository.manager.transaction(async manager => {
            console.log('trade executed');

            if (order.amount === order.fullfilled) {
                order.status = OrderStatus.Filled;
            }

            await manager.save(order);

            await Promise.all(
                map(matches.matchedOrders, async matchedOrder => {
                    const trade = this.tradeRepository.create({
                        makerOrderId: matchedOrder.order.id,
                        takerOrderId: order.id,
                        amount: matchedOrder.amount,
                        price: matchedOrder.price,
                    });
                    await manager.save(trade);
                    await manager.save(matchedOrder.order);
                }),
            );
        });

        await this.kafkaProducer.produce({
            topic: KafkaTopic.SUBMIT_TRANSACTION,
            messages: matches.matchedOrders.map(matchedOrder => {
                return {
                    value: JSON.stringify({ matchedOrder }),
                };
            }),
        });
    }
}
