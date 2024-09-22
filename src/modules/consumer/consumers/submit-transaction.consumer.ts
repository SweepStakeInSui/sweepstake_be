import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';

@Injectable()
export class SubmitTransactionConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,

        private readonly transactionService: TransactionService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.SUBMIT_TRANSACTION]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.SUBMIT_TRANSACTION] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });
                    // TODO: Implement submitTransaction method in TransactionService
                    const { txData, signature } = JSON.parse(message.value.toString());
                    const txResp = await this.transactionService.submitTransaction(txData, signature);

                    console.log('Transaction submitted: ', txResp.digest);
                },
            },
        );
    }
}
