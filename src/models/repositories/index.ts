import { AuthRepository } from './auth.repository';
import { ChainRepository } from './chain.repository';
import { ConditionRepository } from './condition.repository';
import { CriteriaRepository } from './criteria.repository';
import { MarketRepository } from './market.repository';
import { OrderRepository } from './order.repository';
import { OutcomeRepository } from './outcome.repository';
import { TradeRepository } from './trade.repository';
import { TransactionRepository } from './transaction.repository';
import { UserRepository } from './user.repository';

export const Repositories = [
    AuthRepository,
    UserRepository,
    MarketRepository,
    OutcomeRepository,
    ConditionRepository,
    CriteriaRepository,
    OrderRepository,
    TradeRepository,
    ChainRepository,
    TransactionRepository,
];
