import { KafkaConsumerService } from '@shared/modules/kafka/services/kafka-consumer.service';
import { KafkaTopic } from '../constants/consumer.constant';
import { TransactionService } from '@modules/chain/services/transaction.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaAdminService } from '@shared/modules/kafka/services/kafka-admin.service';
import { v4 } from 'uuid';

@Injectable()
export class WaitTransactionConsumer implements OnModuleInit {
    constructor(
        private readonly kafkaConsumerService: KafkaConsumerService,
        private readonly kafkaAdminService: KafkaAdminService,
        private readonly transactionService: TransactionService,
    ) {}

    async onModuleInit() {
        await this.kafkaAdminService.createTopics([KafkaTopic.WAIT_TRANSACTION]);
        await this.kafkaConsumerService.consume(
            v4(),
            { topics: [KafkaTopic.WAIT_TRANSACTION] },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    console.log({
                        topic,
                        partition,
                        value: message.value.toString(),
                    });

                    const txHash = JSON.parse(message.value.toString()).txHash;
                    const txResp = await this.transactionService.waitForTransaction(txHash);

                    console.log('Transaction executed: ', txResp);
                },
            },
        );
    }
}
