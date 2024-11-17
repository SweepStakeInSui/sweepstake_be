import { Module } from '@nestjs/common';
import { SnapshotPriceTask } from './tasks/snapshot-price.task';

const controllers = [];
const services = [];
const tasks = [SnapshotPriceTask];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services, ...tasks],
})
export class JobModule {}
