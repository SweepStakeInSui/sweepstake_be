import { OrderEntity } from '@models/entities/order.entity';
import { MatchingEngineService } from '@modules/matching-engine/services/matching-engine.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { plainToClass } from 'class-transformer';

@Injectable()
export class MatchOrderConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly matchingEngineService: MatchingEngineService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopic([KafkaTopic.MATCH_ORDER]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.MATCH_ORDER] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });

                    const orderInfo = plainToClass(OrderEntity, JSON.parse(message.value.toString()));
                    await this.matchingEngineService.matchOrder(orderInfo);
                },
            },
        );
    }
}
