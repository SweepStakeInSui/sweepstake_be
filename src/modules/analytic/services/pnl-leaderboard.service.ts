import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { Logger } from 'log4js';
import { SnapshotPnlService } from './snapshot-pnl.service';
import { LeaderboardPeriod } from '../types/leaderboard.type';
import { SnapshotPnlRepository } from '@models/repositories/snapshot-pnl.repository';
import dayjs from 'dayjs';

export class PnlLeaderboardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,

        private readonly snapshotPnlService: SnapshotPnlService,
        private readonly snapshotPnlRepository: SnapshotPnlRepository,
    ) {
        this.logger = this.loggerService.getLogger(SnapshotPnlService.name);
        this.configService = configService;
    }

    async insert(userId: string, newPnl: bigint) {
        [LeaderboardPeriod.Daily, LeaderboardPeriod.Weekly, LeaderboardPeriod.Monthly].map(async period => {
            const lastTime = this.lastTime(period);

            const lastPnl = await this.snapshotPnlRepository.findOneBy({
                userId,
                timestamp: lastTime,
            });

            const pnl = lastPnl ? newPnl - lastPnl.value : newPnl;
            await this.redis.zadd(`pnl_leaderboard_${period}`, pnl.toString(), userId);
        });
    }

    async get(period: LeaderboardPeriod, top: number) {
        const sortedSet = await this.redis.zrange(`pnl_leaderboard_${period}`, 0, top - 1, 'WITHSCORES');

        const leaderboard = [];
        for (let i = 0; i < sortedSet.length; i += 2) {
            leaderboard.push({ userId: sortedSet[i], volume: sortedSet[i + 1] });
        }

        return leaderboard;
    }

    async reset(period: LeaderboardPeriod) {
        await this.redis.del(`pnl_leaderboard_${period}`);

        console.log(`leaderboard ${period} reseted`);
    }

    private lastTime(period: LeaderboardPeriod) {
        let lastTime = 0;
        switch (period) {
            case LeaderboardPeriod.Daily:
                lastTime = dayjs().startOf('hour').subtract(1, 'day').unix();
                break;
            case LeaderboardPeriod.Weekly:
                lastTime = dayjs().startOf('hour').subtract(1, 'week').unix();
                break;
            case LeaderboardPeriod.Monthly:
                lastTime = dayjs().startOf('hour').subtract(1, 'month').unix();
                break;
        }
        return lastTime;
    }
}
