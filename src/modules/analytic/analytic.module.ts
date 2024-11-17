import { Module } from '@nestjs/common';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { LeaderboardService } from './services/leaderboard.services.';
import { SnapshotService } from './services/snapshot.service';
import { PriceHistoryController } from './controllers/price-history.controller';
import { PriceHistoryService } from './services/price-history.service';

const controllers = [LeaderboardController, PriceHistoryController];
const services = [LeaderboardService, SnapshotService, PriceHistoryService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
    exports: [...services],
})
export class AnalyticModule {}
