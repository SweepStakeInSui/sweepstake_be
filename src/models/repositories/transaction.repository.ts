import { TransactionEntity } from '@models/entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class TransactionRepository extends BaseRepository<TransactionEntity> {
    constructor(
        @InjectRepository(TransactionEntity)
        private repository: Repository<TransactionEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
