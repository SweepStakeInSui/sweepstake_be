import { AuthModule } from './auth/auth.module';
import { ChainModule } from './chain/chain.module';
import { ConsumerModule } from './consumer/consumer.module';
import { MarketModule } from './market/market.module';
import { MatchingEngineModule } from './matching-engine/matching-engine.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { CategoryModule } from '@modules/category/category.module';
import { FileModule } from './file/file.module';
import { AnalyticModule } from './analytic/analytic.module';
import { JobModule } from './job/job.module';

export const Modules = [
    AuthModule,
    UserModule,
    CommentModule,

    MarketModule,
    OrderModule,
    MatchingEngineModule,

    ChainModule,
    ConsumerModule,

    NotificationModule,
    CategoryModule,

    FileModule,

    AnalyticModule,

    JobModule,
];
