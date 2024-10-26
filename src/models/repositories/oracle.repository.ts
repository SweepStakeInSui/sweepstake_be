import { BaseRepository } from '@shared/base/models/base.repository';
import { OracleEntity } from '@models/entities/oracle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class OracleRepository extends BaseRepository<OracleEntity> {
    constructor(
        @InjectRepository(OracleEntity)
        private repository: Repository<OracleEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
