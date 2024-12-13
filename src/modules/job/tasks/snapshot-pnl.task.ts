import { Injectable } from '@nestjs/common';
import { SnapshotPnlRepository } from '@models/repositories/snapshot-pnl.repository';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRepository } from '@models/repositories/user.repository';
import dayjs from 'dayjs';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';

@Injectable()
export class SnapshotPnlTask {
    constructor(
        private loggerService: LoggerService,
        private kafkaProducer: KafkaProducerService,
        private readonly snapshotPnlRepository: SnapshotPnlRepository,
        private readonly userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPnlTask.name);
    }

    private logger: Logger;
    protected configService: ConfigService;

    @Cron(CronExpression.EVERY_4_HOURS)
    async snapshot() {
        console.log('snapshotPnl');

        const userInfos = await this.userRepository.find({
            select: ['id'],
        });

        const msgMetaData = await this.kafkaProducer.produce({
            topic: KafkaTopic.SNAPSHOT_PNL,
            messages: userInfos.map(userInfo => ({
                value: JSON.stringify({ userId: userInfo.id, timestamp: dayjs().startOf('hour').unix() }),
            })),
        });

        console.log(msgMetaData);
    }
}
