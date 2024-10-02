import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { WalletStrategy } from './strategies/wallet.strategy';
import { ChainModule } from '@modules/chain/chain.module';

const controllers = [AuthController];
const services = [AuthService];
const strategies = [AccessTokenStrategy, RefreshTokenStrategy, WalletStrategy];

@Module({
    imports: [ChainModule],
    controllers: [...controllers],
    providers: [...services, ...strategies],
})
export class AuthModule {}
