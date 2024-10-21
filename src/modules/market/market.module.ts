import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';
import { ChainModule } from '@modules/chain/chain.module';
import { CommentModule } from '@modules/comment/comment.module';
import { CommentService } from '@modules/comment/services/comment.service';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';

const controllers = [MarketController];
const services = [MarketService, CommentService];

@Module({
    imports: [MatchingEngineModule, ChainModule, CommentModule],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
