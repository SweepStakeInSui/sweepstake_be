import { AuthEntity } from './auth.entity';
import { ChainEventEntity } from './chain-event.entity';
import { ChainEntity } from './chain.entity';
import { ConditionEntity } from './condition.entity';
import { CriteriaEntity } from './criteria.entity';
import { MarketEntity } from './market.entity';
import { OrderEntity } from './order.entity';
import { OutcomeEntity } from './outcome.entity';
import { TokenEntity } from './token.entity';
import { TradeEntity } from './trade.entity';
import { TransactionEntity } from './transaction.entity';
import { UserEntity } from './user.entity';

export const Entities = [
    AuthEntity,
    UserEntity,

    MarketEntity,
    ConditionEntity,
    CriteriaEntity,
    OutcomeEntity,

    OrderEntity,
    TradeEntity,

    ChainEntity,
    ChainEventEntity,
    TokenEntity,
    TransactionEntity,
];
