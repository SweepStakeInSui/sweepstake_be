import { Module } from '@nestjs/common';
import { MatchOrderConsumer } from './consumers/match-order.consumer';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';
import { CreateMarketProcessor } from './consumers/create-market-event.consumer';
import { ExecuteTradeConsumer } from './consumers/execute-trade.consumer';
import { OrderModule } from '@modules/order/order.module';
import { SubmitTransactionConsumer } from './consumers/submit-transaction.consumer';
import { ChainModule } from '@modules/chain/chain.module';
import { WaitTransactionConsumer } from './consumers/wait-transaction.consumer';
import { ProccessEventConsumer } from './consumers/proccess-event';
import { CreateNotificationConsumer } from './consumers/create-notification.consumer';
import { NotificationModule } from '@modules/notification/notification.module';
import { SnapshotPriceConsumer } from './consumers/snapshot-price.consumer';
import { AnalyticModule } from '@modules/analytic/analytic.module';

const modules = [MatchingEngineModule, OrderModule, ChainModule, NotificationModule, AnalyticModule];
const consumers = [
    MatchOrderConsumer,
    CreateMarketProcessor,
    ExecuteTradeConsumer,
    SubmitTransactionConsumer,
    WaitTransactionConsumer,
    ProccessEventConsumer,
    CreateNotificationConsumer,
    SnapshotPriceConsumer,
];

@Module({
    imports: [...modules],
    controllers: [],
    providers: [...consumers],
})
export class ConsumerModule {}
