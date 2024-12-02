import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotPnlService } from './snapshot-pnl.service';
import { LeaderboardPeriod } from '../types/leaderboard.type';

export class VolumeLeaderboardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPnlService.name);
        this.configService = configService;
    }

    async update(userId: string, amount: bigint) {
        Object.values(LeaderboardPeriod).forEach(async period => {
            const currentVolume = await this.redis.zscore('volume_leaderboard', userId);
            console.log('currentVolume', currentVolume);
            const newVolume = currentVolume ? BigInt(currentVolume) + amount : amount;
            console.log('newVolume', newVolume);
            await this.redis.zadd(`volume_leaderboard_${period}`, newVolume.toString(), userId);
        });
    }

    async get(period: LeaderboardPeriod, top: number) {
        const sortedSet = await this.redis.zrange(`volume_leaderboard_${period}`, 0, top - 1, 'WITHSCORES');

        const leaderboard = [];
        for (let i = 0; i < sortedSet.length; i += 2) {
            leaderboard.push({ userId: sortedSet[i], volume: sortedSet[i + 1] });
        }

        return leaderboard;
    }

    async reset(period: LeaderboardPeriod) {
        await this.redis.del(`volume_leaderboard_${period}`);

        console.log(`leaderboard ${period} reseted`);
    }
}
