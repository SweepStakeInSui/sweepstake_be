import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';
import { ChainModule } from '@modules/chain/chain.module';
import { CommentModule } from '@modules/comment/comment.module';
import { CommentService } from '@modules/comment/services/comment.service';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { BullModule } from '@nestjs/bull';
import { MarketProcessor } from '@modules/market/processors/market.processor';
import { OracleService } from '@modules/oracle/services/oracle.service';
import { bullConfig } from '@config/redis.config';

const controllers = [MarketController];
const services = [MarketService, CommentService, MarketProcessor, OracleService];
const bullCon = BullModule.forRoot(bullConfig);
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
    imports: [MatchingEngineModule, ChainModule, CommentModule, bullModule, bullCon],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
