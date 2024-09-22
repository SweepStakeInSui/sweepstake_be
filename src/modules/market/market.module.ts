import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';
import { ChainModule } from '@modules/chain/chain.module';

const controllers = [MarketController];
const services = [MarketService];

@Module({
    imports: [ChainModule],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
