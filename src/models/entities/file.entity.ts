import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { NotificationStatus } from '@modules/notification/types/notification';
import dayjs from 'dayjs';
import { StorageEngine } from '@modules/file/types/storage.type';

@Entity({ name: 'file' })
export class FileEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'varchar' })
    public type: string;

    @Column({ type: 'enum', default: dayjs().unix() })
    storage: StorageEngine;

    @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.Unread })
    public status: NotificationStatus;
}
