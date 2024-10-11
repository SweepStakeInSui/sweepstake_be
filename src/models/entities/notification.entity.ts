import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { NotificationStatus } from '@modules/notification/types/notification';
import dayjs from 'dayjs';

@Entity({ name: 'notification' })
export class NotificationEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'varchar' })
    public message: string;

    @Column({ type: 'varchar' })
    public type: string;

    @Column({ type: 'int', default: dayjs().unix() })
    timestamp: number;

    @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.Unread })
    public status: NotificationStatus;
}
