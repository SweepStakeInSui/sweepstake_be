import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotTime } from '../types/snapshot.type';
import { UserRepository } from '@models/repositories/user.repository';
import { ShareRepository } from '@models/repositories/share.repository';
import { SnapshotBalanceRepository } from '@models/repositories/snapshot-balance.repository';

@Injectable()
export class SnapshotBalanceService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly userRepository: UserRepository,
        private readonly shareRepository: ShareRepository,

        private readonly snapshotBalanceRepository: SnapshotBalanceRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotBalanceService.name);
        this.configService = configService;
    }

    async snapshot(userId: string, timestamp: number) {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        const shareInfos = await this.shareRepository.find({
            where: {
                userId: userId,
            },
            relations: ['outcome'],
        });

        const sharesValue = shareInfos.reduce((acc, share) => {
            return (
                acc + share.balance * ((share.outcome.askPrice - share.outcome.bidPrice) / 2n + share.outcome.bidPrice)
            );
        }, 0n);

        const totalValue = user.balance + sharesValue;

        const snapshotPnlInfos = this.snapshotBalanceRepository.create({
            userId,
            timestamp,
            value: totalValue,
            snapshotTime: SnapshotTime.FourHours,
        });

        await this.snapshotBalanceRepository.save(snapshotPnlInfos);
    }
}
