import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { SnapshotPriceEntity } from '@models/entities/snapshot-price.entity';
import { SnapshotService } from '@modules/analytic/services/snapshot.service';

@Injectable()
export class SnapshotPriceConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly snapshotService: SnapshotService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.SNAPSHOT_PRICE]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.SNAPSHOT_PRICE] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });

                    const snapshot = JSON.parse(message.value.toString()) as SnapshotPriceEntity;
                    await this.snapshotService.snapshotPrice(snapshot);
                },
            },
        );
    }
}
