import { Injectable } from '@nestjs/common';
import { SnapshotPnlRepository } from '@models/repositories/snapshot-pnl.repository';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SnapshotTime } from '@modules/analytic/types/snapshot.type';
import { UserRepository } from '@models/repositories/user.repository';

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

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async oneDaySnapshot() {
        await this.snapshot(SnapshotTime.OneDay);
    }

    @Cron(CronExpression.EVERY_WEEK)
    async oneWeekSnapshot() {
        await this.snapshot(SnapshotTime.OneWeek);
    }

    private async snapshot(snapshotTime: SnapshotTime) {
        console.log('snapshotTime', snapshotTime);
    }
    //     const users = await this.userRepository.find();
    //     Promise.all(
    //         users.map(async user => {
    //             const snapshotPnlInfo = this.snapshotPnlRepository.create({
    //                 userId: user.id,
    //             });
    //         }),
    //     );
    // }
}
