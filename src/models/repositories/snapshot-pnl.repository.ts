import { BaseRepository } from '@shared/base/models/base.repository';
import { SnapshotPnlEntity } from '@models/entities/snapshot-pnl.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class SnapshotPnlRepository extends BaseRepository<SnapshotPnlEntity> {
    constructor(
        @InjectRepository(SnapshotPnlEntity)
        private repository: Repository<SnapshotPnlEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
