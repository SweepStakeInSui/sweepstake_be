import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { PnlLeaderboardService } from '@modules/analytic/services/pnl-leaderboard.service';

@Injectable()
export class UpdatePnlLeaderboarConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly pnlLeaderboardService: PnlLeaderboardService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.CALCULATE_PNL_LEADERBOARD]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.CALCULATE_PNL_LEADERBOARD] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    const msg = JSON.parse(message.value.toString());
                    await this.pnlLeaderboardService.insert(msg.userId, msg.amount);
                },
            },
        );
    }
}
