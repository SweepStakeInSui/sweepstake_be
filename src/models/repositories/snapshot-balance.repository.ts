import { BaseRepository } from '@shared/base/models/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnapshotBalanceEntity } from '@models/entities/snapshot-balance.entity';

export class SnapshotBalanceRepository extends BaseRepository<SnapshotBalanceEntity> {
    constructor(
        @InjectRepository(SnapshotBalanceEntity)
        private repository: Repository<SnapshotBalanceEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
