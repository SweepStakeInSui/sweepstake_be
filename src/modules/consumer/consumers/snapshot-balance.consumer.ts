import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { SnapshotBalanceService } from '@modules/analytic/services/snapshot-balance.service';

@Injectable()
export class SnapshotBalanceConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly snapshotService: SnapshotBalanceService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.SNAPSHOT_BALANCE]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.SNAPSHOT_BALANCE] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });

                    const snapshot = JSON.parse(message.value.toString());
                    await this.snapshotService.snapshot(snapshot.userId, snapshot.timestamp);
                },
            },
        );
    }
}
