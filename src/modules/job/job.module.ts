import { Module } from '@nestjs/common';
import { SnapshotPriceTask } from './tasks/snapshot-price.task';
import { ResetVolumeLeaderboardTask } from './tasks/reset-volume-leaderboard.task';
import { AnalyticModule } from '@modules/analytic/analytic.module';

const controllers = [];
const services = [];
const tasks = [SnapshotPriceTask, ResetVolumeLeaderboardTask];

@Module({
    imports: [AnalyticModule],
    controllers: [...controllers],
    providers: [...services, ...tasks],
})
export class JobModule {}
