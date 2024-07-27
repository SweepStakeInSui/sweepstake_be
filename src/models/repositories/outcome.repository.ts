import { OutcomeEntity } from '@models/entities/outcome.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class OutcomeRepository extends Repository<OutcomeEntity> {
    constructor(
        @InjectRepository(OutcomeEntity)
        private repository: Repository<OutcomeEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
