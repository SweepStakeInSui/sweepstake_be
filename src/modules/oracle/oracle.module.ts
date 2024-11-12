import { OracleService } from '@modules/oracle/services/oracle.service';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RewardService } from '@modules/oracle/services/reward.service';
import { TransactionService } from '@modules/chain/services/transaction.service';

const services = [OracleService, RewardService, TransactionService];
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
