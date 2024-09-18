import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Admin, Kafka } from 'kafkajs';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { EEnvKey } from '@constants/env.constant';

@Injectable()
export class KafkaAdminService implements OnApplicationShutdown {
    protected logger: Logger;
    protected configService: ConfigService;
    private readonly kafka: Kafka;
    private readonly admin: Admin;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
    ) {
        this.logger = this.loggerService.getLogger(KafkaAdminService.name);
        this.configService = configService;

        this.kafka = new Kafka({
            clientId: 'kafka',
            brokers: [`${this.configService.get(EEnvKey.KAFKA_HOST)}:${this.configService.get(EEnvKey.KAFKA_PORT)}`],
        });

        this.admin = this.kafka.admin();
    }

    async onModuleInit() {
        await this.admin.connect();
    }
    async onApplicationShutdown() {
        await this.admin.disconnect();
    }

    async createTopics(topics: string[]) {
        await this.admin.createTopics({
            waitForLeaders: true,
            topics: topics.map(topic => {
                return {
                    topic,
                };
            }),
        });
    }
}
