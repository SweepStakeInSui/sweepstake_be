import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

const controllers = [UserController];
const services = [UserService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class UserModule {}
