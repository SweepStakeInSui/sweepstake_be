import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';
import { SuiEvent } from '@mysten/sui/dist/cjs/client';
import { EventService } from '@modules/chain/services/event.service';

@Injectable()
export class ProccessEventConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly eventService: EventService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.PROCCESS_EVENT]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.PROCCESS_EVENT] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });

                    const events = JSON.parse(message.value.toString()).events as SuiEvent[];
                    console.log('Event proccessed: ', events);
                    await this.eventService.proccessEvent(events);
                },
            },
        );
    }
}
