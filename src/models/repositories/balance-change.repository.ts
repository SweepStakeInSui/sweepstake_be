import { BalanceChangeEntity } from '@models/entities/balance-change.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class BalanceChangeRepository extends BaseRepository<BalanceChangeEntity> {
    constructor(
        @InjectRepository(BalanceChangeEntity)
        private repository: Repository<BalanceChangeEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
