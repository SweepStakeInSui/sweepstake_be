import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { WalletService } from './services/wallet.service';

const controllers = [UserController];
const services = [UserService, WalletService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class UserModule {}
