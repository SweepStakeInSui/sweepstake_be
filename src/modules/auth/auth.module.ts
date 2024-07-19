import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

const controllers = [AuthController];
const services = [AuthService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class AuthModule {}
