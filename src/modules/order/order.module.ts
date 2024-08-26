import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MatchingEngineModule } from '@modules/matching-engine/matching-engine.module';

const controllers = [OrderController];
const services = [OrderService];

@Module({
    imports: [MatchingEngineModule],
    controllers: [...controllers],
    providers: [...services],
})
export class OrderModule {}
