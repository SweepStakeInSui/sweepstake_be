import { AuthRepository } from './auth.repository';
import { ChainRepository } from './chain.repository';
import { ConditionRepository } from './condition.repository';
import { CriteriaRepository } from './criteria.repository';
import { MarketRepository } from './market.repository';
import { NotificationRepository } from './notification.repository';
import { OrderRepository } from './order.repository';
import { OutcomeRepository } from './outcome.repository';
import { ShareRepository } from './share.repository';
import { TradeRepository } from './trade.repository';
import { TransactionRepository } from './transaction.repository';
import { UserRepository } from './user.repository';
import { CommentRepository } from '@models/repositories/comment.repository';
import { CategoryRepository } from '@models/repositories/category.repository';
import { BalanceChangeRepository } from './balance-change.repository';
import { OracleRepository } from '@models/repositories/oracle.repository';
import { SnapshotPriceRepository } from './snapshot-price.repository';
import { SnapshotPnlRepository } from './snapshot-pnl.repository';
import { SnapshotBalanceRepository } from './snapshot-balance.repository';

export const Repositories = [
    AuthRepository,
    UserRepository,

    BalanceChangeRepository,

    MarketRepository,
    CategoryRepository,
    CommentRepository,
    OutcomeRepository,
    ShareRepository,
    OracleRepository,

    ConditionRepository,
    CriteriaRepository,

    OrderRepository,
    TradeRepository,

    ChainRepository,
    TransactionRepository,

    NotificationRepository,

    SnapshotPriceRepository,
    SnapshotPnlRepository,
    SnapshotBalanceRepository,
];
