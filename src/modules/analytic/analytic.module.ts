import { Module } from '@nestjs/common';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { LeaderboardService } from './services/leaderboard.services.';
import { SnapshotPriceService } from './services/snapshot-price.service';
import { PriceHistoryController } from './controllers/price-history.controller';
import { PriceHistoryService } from './services/price-history.service';
import { VolumeLeaderboardService } from './services/volume-leaderboard.service';
import { SnapshotPnlService } from './services/snapshot-pnl.service';
import { PnlLeaderboardService } from './services/pnl-leaderboard.service';
import { UserModule } from '@modules/user/user.module';

const controllers = [LeaderboardController, PriceHistoryController];
const services = [
    LeaderboardService,
    PriceHistoryService,
    VolumeLeaderboardService,
    PnlLeaderboardService,
    SnapshotPriceService,
    SnapshotPnlService,
];

@Module({
    imports: [UserModule],
    controllers: [...controllers],
    providers: [...services],
    exports: [...services],
})
export class AnalyticModule {}
