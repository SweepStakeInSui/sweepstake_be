import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotPriceRepository } from '@models/repositories/snapshot-price.repository';
import { SnapshotTime } from '../types/snapshot.type';
import { Between } from 'typeorm';

@Injectable()
export class PriceHistoryService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly snapshotPriceRepository: SnapshotPriceRepository,
    ) {
        this.logger = this.loggerService.getLogger(PriceHistoryService.name);
        this.configService = configService;
    }

    async getPriceHistoy(marketId: string, snapshotTime: SnapshotTime, start: number, end: number) {
        return this.snapshotPriceRepository.findBy({
            marketId,
            snapshotTime,
            timestamp: Between(start, end),
        });
    }
}
