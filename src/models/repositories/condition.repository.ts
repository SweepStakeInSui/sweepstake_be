import { ConditionEntity } from '@models/entities/condition.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class ConditionRepository extends BaseRepository<ConditionEntity> {
    constructor(
        @InjectRepository(ConditionEntity)
        private repository: Repository<ConditionEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
