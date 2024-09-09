import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchOrderProcessor } from './processors/match-order.processor';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { CreateMarketProcessor } from './processors/create-market-event.processor';
import { ExecuteTradeProcessor } from './processors/execute-trade.processor';

const processors = [MatchOrderProcessor, CreateMarketProcessor, ExecuteTradeProcessor];

@Module({
    imports: [TypeOrmModule.forFeature([]), MatchingEngineModule],
    controllers: [],
    providers: [...processors],
})
export class ConsumerModule {}
