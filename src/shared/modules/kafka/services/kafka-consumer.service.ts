import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopics, Kafka } from 'kafkajs';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { EEnvKey } from '@constants/env.constant';

@Injectable()
export class KafkaConsumerService implements OnApplicationShutdown {
    protected logger: Logger;
    protected configService: ConfigService;
    private readonly kafka: Kafka;
    private readonly consumers: Consumer[] = [];

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
    ) {
        this.logger = this.loggerService.getLogger(KafkaConsumerService.name);
        this.configService = configService;

        this.kafka = new Kafka({
            clientId: 'sweepstake',
            brokers: [`${this.configService.get(EEnvKey.KAFKA_HOST)}:${this.configService.get(EEnvKey.KAFKA_PORT)}`],
            connectionTimeout: 3000,
        });
    }

    async onApplicationShutdown() {
        for (const consumer of this.consumers) {
            await consumer.disconnect();
        }
    }

    async consume(groupId: string, topics: ConsumerSubscribeTopics, config: ConsumerRunConfig) {
        const cosumer: Consumer = this.kafka.consumer({ groupId: groupId });
        await cosumer.connect().catch(e => console.error(e));
        await cosumer.subscribe(topics);
        await cosumer.run(config);
        this.consumers.push(cosumer);
    }
}
