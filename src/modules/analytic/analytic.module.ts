import { Module } from '@nestjs/common';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { LeaderboardService } from './services/leaderboard.services.';

const controllers = [LeaderboardController];
const services = [LeaderboardService];
const strategies = [];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services, ...strategies],
})
export class AnalyticModule {}
