import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Partitioners, Producer, ProducerRecord } from 'kafkajs';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { EEnvKey } from '@constants/env.constant';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnApplicationShutdown {
    protected logger: Logger;
    protected configService: ConfigService;

    private readonly kafka: Kafka;
    private readonly producer: Producer;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
    ) {
        this.logger = this.loggerService.getLogger(KafkaProducerService.name);
        this.configService = configService;

        this.kafka = new Kafka({
            clientId: 'sweepstake',
            brokers: [`${this.configService.get(EEnvKey.KAFKA_HOST)}:${this.configService.get(EEnvKey.KAFKA_PORT)}`],
        });
        this.producer = this.kafka.producer({
            allowAutoTopicCreation: true,
            createPartitioner: Partitioners.LegacyPartitioner,
        });
    }

    async onModuleInit() {
        await this.producer.connect();
    }
    async onApplicationShutdown() {
        await this.producer.disconnect();
    }

    async produce(record: ProducerRecord) {
        return await this.producer.send(record);
    }
}
