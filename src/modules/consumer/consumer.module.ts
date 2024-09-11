import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchOrderConsumer } from './consumers/match-order.consumer';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { CreateMarketProcessor } from './consumers/create-market-event.consumer';
import { ExecuteTradeConsumer } from './consumers/execute-trade.consumer';

const processors = [MatchOrderConsumer, CreateMarketProcessor, ExecuteTradeConsumer];

@Module({
    imports: [TypeOrmModule.forFeature([]), MatchingEngineModule],
    controllers: [],
    providers: [...processors],
})
export class ConsumerModule {}
