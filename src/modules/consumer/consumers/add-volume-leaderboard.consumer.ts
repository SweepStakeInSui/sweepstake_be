import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { VolumeLeaderboardService } from '@modules/analytic/services/volume-leaderboard.service';

@Injectable()
export class AddVolumeLeaderboarConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly volumeLeaderboardService: VolumeLeaderboardService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.ANALYSE_TRADE]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.ANALYSE_TRADE] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    const orderInfo = JSON.parse(message.value.toString());
                    await this.volumeLeaderboardService.update(orderInfo.userId, orderInfo.amount);
                },
            },
        );
    }
}
