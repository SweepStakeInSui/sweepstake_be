import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

const controllers = [OrderController];
const services = [OrderService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class OrderModule {}
