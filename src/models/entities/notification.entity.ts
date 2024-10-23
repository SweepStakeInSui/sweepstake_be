import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { NotificationStatus, NotificationType } from '@modules/notification/types/notification';
import dayjs from 'dayjs';

@Entity({ name: 'notification' })
export class NotificationEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'varchar' })
    public message: string;

    @Column({ type: 'enum', enum: NotificationType })
    public type: NotificationType;

    @Column({ type: 'json' })
    public data: object;

    @Column({ type: 'int' })
    timestamp: number = dayjs().unix();

    @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.Unread })
    public status: NotificationStatus;
}
