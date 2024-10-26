import { OracleService } from '@modules/oracle/services/oracle.service';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

const services = [OracleService];
const bullModule = BullModule.registerQueue({
    name: 'market',
    defaultJobOptions: {
        attempts: 5,
        backoff: 1000,
    },
    limiter: {
        max: 100,
        duration: 10000,
    },
});
@Module({
    imports: [bullModule],
    controllers: [],
    providers: [...services],
})
export class OracleModule {}
