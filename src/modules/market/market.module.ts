import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';
import { ChainModule } from '@modules/chain/chain.module';
import { CommentModule } from '@modules/comment/comment.module';
import { CommentService } from '@modules/comment/services/comment.service';

const controllers = [MarketController];
const services = [MarketService, CommentService];

@Module({
    imports: [ChainModule, CommentModule],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
