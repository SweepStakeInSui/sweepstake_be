import { MatchingEngineService } from '@modules/matching-engine/services/matching-engine.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';

@Injectable()
export class CreateMarketProcessor implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly matchingEngineService: MatchingEngineService,
    ) {}

    async onModuleInit() {
        // this.kafkaConsumerService.consume(
        //     'kafka',
        //     { topics: ['create-order'] },
        //     {`
        //         eachMessage: async ({ topic, partition, message }) => {
        //             console.log({
        //                 topic,
        //                 partition,
        //                 value: message.value.toString(),
        //             });
        //             const orderInfo = JSON.parse(message.value.toString()) as OrderEntity;
        //             await this.matchingEngineService.addOrder(orderInfo);
        //         },
        //     },
        // );
    }
}
