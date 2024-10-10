import { Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';

const controllers = [NotificationController];
const services = [NotificationService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
    exports: [...services],
})
export class NotificationModule {}
