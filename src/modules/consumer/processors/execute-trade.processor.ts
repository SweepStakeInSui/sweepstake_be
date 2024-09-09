import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';

export class ExecuteTradeProcessor {
    constructor(private readonly kafkaConsumerService: KafkaConsumerService) {}

    async onModuleInit() {
        // this.kafkaConsumerService.consume(
        //     'kafka',
        //     { topics: ['create-order'] },
        //     {
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
