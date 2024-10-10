import { NotificationEntity } from '@models/entities/notification.entity';
import { Pagination } from 'nestjs-typeorm-paginate';

export class GetNotificationResponseDto extends Pagination<NotificationEntity> {}
