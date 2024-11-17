import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotPriceRepository } from '@models/repositories/snapshot-price.repository';
import { SnapshotTime } from '../types/snapshot.type';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { SnapshotPriceEntity } from '@models/entities/snapshot-price.entity';

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

    async getPriceHistoy(options: IPaginationOptions, marketId: string, snapshotTime: SnapshotTime) {
        return paginate<SnapshotPriceEntity>(this.snapshotPriceRepository, options, {
            where: {
                marketId,
                snapshotTime,
            },
        });
    }
}
