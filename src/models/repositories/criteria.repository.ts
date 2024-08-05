import { CriteriaEntity } from '@models/entities/criteria.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class CriteriaRepository extends BaseRepository<CriteriaEntity> {
    constructor(
        @InjectRepository(CriteriaEntity)
        private repository: Repository<CriteriaEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
