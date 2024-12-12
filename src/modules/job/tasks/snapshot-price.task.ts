import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { SnapshotPriceRepository } from '@models/repositories/snapshot-price.repository';
import { SnapshotTime } from '@modules/analytic/types/snapshot.type';
import { KafkaTopic } from '@modules/consumer/constants/consumer.constant';
import { OutcomeType } from '@modules/market/types/outcome';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaProducerService } from '@shared/modules/kafka/services/kafka-producer.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import dayjs from 'dayjs';
import { Logger } from 'log4js';

@Injectable()
export class SnapshotPriceTask {
    constructor(
        private loggerService: LoggerService,
        private kafkaProducer: KafkaProducerService,

        private readonly outcomeRepository: OutcomeRepository,
        private readonly snapshotPriceRepository: SnapshotPriceRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPriceTask.name);
    }

    private logger: Logger;
    protected configService: ConfigService;

    @Cron(CronExpression.EVERY_MINUTE)
    async oneMinuteSnapshot() {
        await this.snapshot(SnapshotTime.OneMinute);
    }

    @Cron(CronExpression.EVERY_30_MINUTES)
    async thirtyMinutesSnapshot() {
        await this.snapshot(SnapshotTime.ThirtyMinutes);
    }

    @Cron(CronExpression.EVERY_HOUR)
    async oneHourSnapshot() {
        await this.snapshot(SnapshotTime.OneHour);
    }

    @Cron(CronExpression.EVERY_4_HOURS)
    async fourHoursSnapshot() {
        await this.snapshot(SnapshotTime.FourHours);
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async oneDaySnapshot() {
        await this.snapshot(SnapshotTime.OneDay);
    }

    @Cron(CronExpression.EVERY_WEEK)
    async oneWeekSnapshot() {
        await this.snapshot(SnapshotTime.OneWeek);
    }

    @Cron('0 0 1 * *')
    async oneMonthSnapshot() {
        await this.snapshot(SnapshotTime.OneMonth);
    }

    private async snapshot(snapshotTime: SnapshotTime) {
        const outcomeInfos = await this.outcomeRepository.find({
            where: {
                market: {
                    isActive: true,
                },
                type: OutcomeType.Yes,
            },
            relations: ['market'],
        });

        Promise.all(
            outcomeInfos.map(async outcomeInfo => {
                const snapshotPriceInfo = this.snapshotPriceRepository.create({
                    marketId: outcomeInfo.market.id,
                    snapshotTime,
                    timestamp: this.snapshotTime(snapshotTime),
                });

                await this.snapshotPriceRepository.save(snapshotPriceInfo);

                const msgMetaData = await this.kafkaProducer.produce({
                    topic: KafkaTopic.SNAPSHOT_PRICE,
                    messages: [
                        {
                            value: JSON.stringify(snapshotPriceInfo),
                        },
                    ],
                });

                console.log(msgMetaData);
            }),
        );
    }

    private snapshotTime(snapshotTime: SnapshotTime) {
        switch (snapshotTime) {
            case SnapshotTime.OneMinute:
                return dayjs().startOf('minute').unix();
            case SnapshotTime.ThirtyMinutes:
                return dayjs().startOf('minute').unix();
            case SnapshotTime.OneHour:
                return dayjs().startOf('hour').unix();
            case SnapshotTime.FourHours:
                return dayjs().startOf('hour').unix();
            case SnapshotTime.OneDay:
                return dayjs().startOf('day').unix();
            case SnapshotTime.OneWeek:
                return dayjs().startOf('week').unix();
            case SnapshotTime.OneMonth:
                return dayjs().startOf('month').unix();
        }
    }
}
