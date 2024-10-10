import { AuthModule } from './auth/auth.module';
import { ChainModule } from './chain/chain.module';
import { ConsumerModule } from './consumer/consumer.module';
import { MarketModule } from './market/market.module';
import { MatchingEngineModule } from './matching-engine/matching-engine.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';

export const Modules = [
    AuthModule,
    UserModule,

    MarketModule,
    OrderModule,
    MatchingEngineModule,

    ChainModule,

    ConsumerModule,

    NotificationModule,
];
