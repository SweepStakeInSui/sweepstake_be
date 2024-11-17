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
import { OutcomeType } from '@modules/market/types/outcome';
import { Between } from 'typeorm';
import dayjs from 'dayjs';

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
                const price = (
                    await this.outcomeRepository.findOneBy({
                        marketId: snapshotInfo.marketId,
                        type: OutcomeType.Yes,
                    })
                ).bidPrice;

                snapshotInfo.price = price;
                await this.snapshotPriceRepository.save(snapshotInfo);

                break;
            }
            case SnapshotTime.ThirtyMinutes: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(30, 'minute').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneMinute,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }
            case SnapshotTime.OneHour: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(1, 'hour').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneMinute,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }
            case SnapshotTime.FourHours: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(4, 'hour').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneHour,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }

            case SnapshotTime.OneDay: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(1, 'day').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneHour,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }
            case SnapshotTime.OneWeek: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(1, 'week').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneDay,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }

            case SnapshotTime.OneMonth: {
                const dt = dayjs.unix(snapshotInfo.timestamp);
                const last = dt.subtract(1, 'month').unix();
                const snapshots = await this.snapshotPriceRepository.findBy({
                    snapshotTime: SnapshotTime.OneDay,
                    marketId: snapshotInfo.marketId,
                    timestamp: Between(last, snapshotInfo.timestamp),
                });

                const price = snapshots.reduce(
                    (sum, snapshot) => sum + (snapshot.price ? BigInt(snapshot.price) : 0n),
                    0n,
                );

                snapshotInfo.price = price / BigInt(snapshots.length);
                await this.snapshotPriceRepository.save(snapshotInfo);
                break;
            }
        }
    }
}
