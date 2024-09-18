import { TradeService } from '@modules/order/services/trade.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { Match } from '@modules/matching-engine/order-book';
import { v4 } from 'uuid';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ExecuteTradeConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly tradeService: TradeService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.EXECUTE_TRADE]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.EXECUTE_TRADE] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    const matches = plainToClass(Match, JSON.parse(message.value.toString()));
                    await this.tradeService.executeTrade(matches);
                },
            },
        );
    }
}
