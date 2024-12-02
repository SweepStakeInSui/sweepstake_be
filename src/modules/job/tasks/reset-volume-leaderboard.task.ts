import { VolumeLeaderboardService } from '@modules/analytic/services/volume-leaderboard.service';
import { LeaderboardPeriod } from '@modules/analytic/types/leaderboard.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

@Injectable()
export class ResetVolumeLeaderboardTask {
    constructor(
        private loggerService: LoggerService,
        private kafkaProducer: KafkaProducerService,

        private readonly volumeLeaderboardService: VolumeLeaderboardService,
    ) {
        this.logger = this.loggerService.getLogger(ResetVolumeLeaderboardTask.name);
    }

    private logger: Logger;
    protected configService: ConfigService;

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetDailyLeaderboard() {
        await this.reset(LeaderboardPeriod.Daily);
    }

    @Cron(CronExpression.EVERY_WEEK)
    async resetWeeklyLeaderboard() {
        await this.reset(LeaderboardPeriod.Weekly);
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async resetMonthlyLeaderboard() {
        await this.reset(LeaderboardPeriod.Monthly);
    }

    private async reset(period: LeaderboardPeriod) {
        await this.volumeLeaderboardService.reset(period);
    }
}
