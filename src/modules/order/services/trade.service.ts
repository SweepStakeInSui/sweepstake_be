import { TradeRepository } from '@models/repositories/trade.repository';
import { Match } from '@modules/matching-engine/order-book';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { map } from 'lodash';
import { Logger } from 'log4js';

export class TradeService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        @Inject()
        private readonly kafkaProducer: KafkaProducerService,

        private readonly tradeRepository: TradeRepository,
    ) {
        this.logger = this.loggerService.getLogger(TradeService.name);
        this.configService = configService;
    }

    public async executeTrade(matches: Match) {
        const order = matches.order;

        for (const matched of matches.matchedOrders) {
            console.log(matched);
        }

        await this.tradeRepository.manager.transaction(async manager => {
            console.log('trade executed');

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

            // await manager.save(trade);
        });
    }
}
