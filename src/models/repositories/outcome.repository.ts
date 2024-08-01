import { OutcomeEntity } from '@models/entities/outcome.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class OutcomeRepository extends BaseRepository<OutcomeEntity> {
    constructor(
        @InjectRepository(OutcomeEntity)
        private repository: Repository<OutcomeEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
