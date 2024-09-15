import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchOrderConsumer } from './consumers/match-order.consumer';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { CreateMarketProcessor } from './consumers/create-market-event.consumer';
import { ExecuteTradeConsumer } from './consumers/execute-trade.consumer';
import { OrderModule } from '@modules/order/order.module';

const modules = [MatchingEngineModule, OrderModule];
const consumers = [MatchOrderConsumer, CreateMarketProcessor, ExecuteTradeConsumer];

@Module({
    imports: [TypeOrmModule.forFeature([]), ...modules],
    controllers: [],
    providers: [...consumers],
})
export class ConsumerModule {}
