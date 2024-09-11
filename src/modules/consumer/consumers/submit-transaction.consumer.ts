import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaGroup, KafkaTopic } from '../constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { OnModuleInit } from '@nestjs/common';

export class SubmitTransactionConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly transactionService: TransactionService,
    ) {}

    async onModuleInit() {
        this.kafkaConsumerService.consume(
            KafkaGroup,
            { topics: [KafkaTopic.SUBMIT_TRANSACTION] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    // TODO: Implement submitTransaction method in TransactionService
                    this.transactionService.submitTransaction(JSON.parse(message.value.toString()));
                },
            },
        );
    }
}
