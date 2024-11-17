import { AuthEntity } from './auth.entity';
import { ChainEventEntity } from './chain-event.entity';
import { ChainEntity } from './chain.entity';
import { ConditionEntity } from './condition.entity';
import { CriteriaEntity } from './criteria.entity';
import { MarketEntity } from './market.entity';
import { NotificationEntity } from './notification.entity';
import { OrderEntity } from './order.entity';
import { OutcomeEntity } from './outcome.entity';
import { ShareEntity } from './share.entity';
import { TokenEntity } from './token.entity';
import { TradeEntity } from './trade.entity';
import { TransactionEntity } from './transaction.entity';
import { UserEntity } from './user.entity';
import { CommentEntity } from '@models/entities/comment.entity';
import { CategoryEntity } from '@models/entities/category.entity';
import { BalanceChangeEntity } from './balance-change.entity';
import { SnapshotPriceEntity } from './snapshot-price.entity';

export const Entities = [
    AuthEntity,
    UserEntity,

    BalanceChangeEntity,

    MarketEntity,
    ConditionEntity,
    CriteriaEntity,
    OutcomeEntity,
    CommentEntity,
    CategoryEntity,
    ShareEntity,

    OrderEntity,
    TradeEntity,

    ChainEntity,
    ChainEventEntity,
    TokenEntity,
    TransactionEntity,

    NotificationEntity,

    SnapshotPriceEntity,
];
