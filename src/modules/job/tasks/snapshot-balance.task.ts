import { Injectable } from '@nestjs/common';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRepository } from '@models/repositories/user.repository';
import dayjs from 'dayjs';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { SnapshotBalanceRepository } from '@models/repositories/snapshot-balance.repository';

@Injectable()
export class SnapshotBalanceTask {
    constructor(
        private loggerService: LoggerService,
        private kafkaProducer: KafkaProducerService,
        private readonly snapshotBalanceRepository: SnapshotBalanceRepository,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotBalanceTask.name);
    }

    private logger: Logger;
    protected configService: ConfigService;

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async snapshot() {
        console.log('snapshotBalance');

        const userInfos = await this.userRepository.find({
            select: ['id'],
        });

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.SNAPSHOT_BALANCE,
            messages: userInfos.map(userInfo => ({
                value: JSON.stringify({ userId: userInfo.id, timestamp: dayjs().unix() }),
            })),
        });

        console.log(msgMetaData);
    }
}
