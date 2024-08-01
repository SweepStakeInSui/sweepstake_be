import { AuthRepository } from './auth.repository';
import { MarketRepository } from './market.repository';
import { OrderRepository } from './order.repository';
import { OutcomeRepository } from './outcome.repository';
import { TradeRepository } from './trade.repository';
import { UserRepository } from './user.repository';

export const Repositories = [
    AuthRepository,
    UserRepository,
    MarketRepository,
    OutcomeRepository,
    OrderRepository,
    TradeRepository,
];
