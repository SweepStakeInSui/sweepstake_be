import { Module } from '@nestjs/common';
import { MarketController } from './controllers/market.controller';
import { MarketService } from './services/market.service';

const controllers = [MarketController];
const services = [MarketService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class MarketModule {}
