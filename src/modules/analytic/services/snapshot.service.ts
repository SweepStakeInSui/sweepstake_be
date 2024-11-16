import { SnapshotPriceEntity } from '@models/entities/snapshot-price.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotTime } from '../types/snapshot.type';
import { OutcomeRepository } from '@models/repositories/outcome.repository';
import { SnapshotPriceRepository } from '@models/repositories/snapshot-price.repository';

@Injectable()
export class SnapshotService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly outcomeRepository: OutcomeRepository,
        private readonly snapshotPriceRepository: SnapshotPriceRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotService.name);
        this.configService = configService;
    }

    async snapshotPrice(snapshotInfo: SnapshotPriceEntity) {
        switch (snapshotInfo.snapshotTime) {
            case SnapshotTime.OneMinute: {
                const price = this.outcomeRepository;
                console.log(price);
                break;
            }
            case SnapshotTime.ThirtyMinutes:
            case SnapshotTime.OneHour:
            case SnapshotTime.FourHours:
            case SnapshotTime.OneDay:
            case SnapshotTime.OneWeek:
            case SnapshotTime.OneMonth:
                break;
        }
    }
}
