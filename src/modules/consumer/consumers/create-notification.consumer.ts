import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { v4 } from 'uuid';
import { NotificationService } from '@modules/notification/services/notification.service';

@Injectable()
export class CreateNotificationConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly notificationService: NotificationService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.CREATE_NOTIFICATION]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.CREATE_NOTIFICATION] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    const notifications = JSON.parse(message.value.toString()).notifications;
                    await this.notificationService.create(notifications);
                },
            },
        );
    }
}
