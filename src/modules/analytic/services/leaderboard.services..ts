import { UserRepository } from '@models/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { LeaderboardPeriod } from '../types/leaderboard.type';
import { In } from 'typeorm';
import { PnlLeaderboardService } from './pnl-leaderboard.service';

@Injectable()
export class LeaderboardService {
    protected logger: Logger;
    protected configService: ConfigService;

    constructor(
        protected loggerService: LoggerService,
        configService: ConfigService,

        private readonly userRepository: UserRepository,
        private readonly pnlLeaderboardServicce: PnlLeaderboardService,
    ) {
        this.logger = this.loggerService.getLogger(LeaderboardService.name);
        this.configService = configService;
    }

    async getVolumeLeaderboard(period: LeaderboardPeriod, limit: number) {
        const leaderboard = await this.pnlLeaderboardServicce.get(period, limit);

        const userIds = leaderboard.map(item => item.userId);
        const users = await this.userRepository.findBy({
            id: In(userIds),
        });

        return users.map(user => {
            return { ...user, volume: leaderboard.find(item => item.userId === user.id)?.volume };
        });
    }

    async getPnlLeaderboard(period: LeaderboardPeriod, limit: number) {
        const leaderboard = await this.pnlLeaderboardServicce.get(period, limit);

        const userIds = leaderboard.map(item => item.userId);
        const users = await this.userRepository.findBy({
            id: In(userIds),
        });

        return users.map(user => {
            return { ...user, pnl: leaderboard.find(item => item.userId === user.id)?.value };
        });
    }
}
