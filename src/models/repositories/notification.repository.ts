import { NotificationEntity } from '@models/entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class NotificationRepository extends BaseRepository<NotificationEntity> {
    constructor(
        @InjectRepository(NotificationEntity)
        private repository: Repository<NotificationEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
