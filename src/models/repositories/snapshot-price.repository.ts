import { SnapshotPriceEntity } from '@models/entities/snapshot-price.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class SnapshotPriceRepository extends BaseRepository<SnapshotPriceEntity> {
    constructor(
        @InjectRepository(SnapshotPriceEntity)
        private repository: Repository<SnapshotPriceEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
