import { ChainEntity } from '@models/entities/chain.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class ChainRepository extends BaseRepository<ChainEntity> {
    constructor(
        @InjectRepository(ChainEntity)
        private repository: Repository<ChainEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
