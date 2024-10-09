import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';
import { ChainModule } from '@modules/chain/chain.module';
import { CommentModule } from '@modules/comment/comment.module';
import { CommentService } from '@modules/comment/services/comment.service';
import { CategoryService } from '@modules/category/services/category.service';
import { CategoryModule } from '@modules/category/category.module';

const controllers = [MarketController];
const services = [MarketService, CommentService, CategoryService];

@Module({
    imports: [ChainModule, CommentModule, CategoryModule],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
