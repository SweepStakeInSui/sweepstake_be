import { ContractEntity } from '@models/entities/contract.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ContractRepository extends Repository<ContractEntity> {
    constructor(
        @InjectRepository(ContractEntity)
        private repository: Repository<ContractEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
