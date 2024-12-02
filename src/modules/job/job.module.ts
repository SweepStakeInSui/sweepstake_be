import { Module } from '@nestjs/common';
import { SnapshotPriceTask } from './tasks/snapshot-price.task';
import { ResetVolumeLeaderboardTask } from './tasks/reset-volume-leaderboard.task';
import { AnalyticModule } from '@modules/analytic/analytic.module';
import { SnapshotPnlTask } from './tasks/snapshot-pnl.task';

const controllers = [];
const services = [];
const tasks = [SnapshotPriceTask, SnapshotPnlTask, ResetVolumeLeaderboardTask];

@Module({
    imports: [AnalyticModule],
    controllers: [...controllers],
    providers: [...services, ...tasks],
})
export class JobModule {}
