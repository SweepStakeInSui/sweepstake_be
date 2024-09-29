import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { TradeService } from './services/trade.service';
import { ChainModule } from '@modules/chain/chain.module';

const controllers = [OrderController];
const services = [OrderService, TradeService];

@Module({
    imports: [MatchingEngineModule, ChainModule],
    controllers: [...controllers],
    providers: [...services],
    exports: [...services],
})
export class OrderModule {}
