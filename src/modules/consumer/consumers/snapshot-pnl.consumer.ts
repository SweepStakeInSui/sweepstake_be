import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { SnapshotPnlService } from '@modules/analytic/services/snapshot-pnl.service';

@Injectable()
export class SnapshotPnlConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly snapshotService: SnapshotPnlService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.SNAPSHOT_PNL]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.SNAPSHOT_PNL] },
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
