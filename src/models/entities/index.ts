import { AuthEntity } from './auth.entity';
import { ConditionEntity } from './condition.entity';
import { CriteriaEntity } from './criteria.entity';
import { MarketEntity } from './market.entity';
import { OrderEntity } from './order.entity';
import { OutcomeEntity } from './outcome.entity';
import { TradeEntity } from './trade.entity';
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
];
