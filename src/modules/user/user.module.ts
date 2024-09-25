import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { WalletService } from './services/wallet.service';
import { ChainModule } from '@modules/chain/chain.module';

const controllers = [UserController];
const services = [UserService, WalletService];

@Module({
    imports: [ChainModule],
    controllers: [...controllers],
    providers: [...services],
})
export class UserModule {}
