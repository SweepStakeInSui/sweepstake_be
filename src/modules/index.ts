import { AuthModule } from './auth/auth.module';
import { MarketModule } from './market/market.module';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';

export const Modules = [AuthModule, UserModule, MarketModule, OrderModule];
