import { OrderEntity } from '@models/entities/order.entity';
import { MatchingEngineService } from '@modules/matching-engine/services/matching-engine.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaGroup, KafkaTopic } from '../constants/consumer.constant';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';

@Injectable()
export class CancelOrderConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly matchingEngineService: MatchingEngineService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopic([KafkaTopic.MATCH_ORDER]);
        this.kafkaConsumerService.consume(
            KafkaGroup,
            { topics: [KafkaTopic.CANCEL_ORDER] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    const orderInfo = JSON.parse(message.value.toString()) as OrderEntity;
                    await this.matchingEngineService.cancelOrer(orderInfo);
                },
            },
        );
    }
}
