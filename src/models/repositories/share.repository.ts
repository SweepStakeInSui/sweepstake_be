import { ShareEntity } from '@models/entities/share.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class ShareRepository extends BaseRepository<ShareEntity> {
    constructor(
        @InjectRepository(ShareEntity)
        private repository: Repository<ShareEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
