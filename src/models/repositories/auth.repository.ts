import { AuthEntity } from '@models/entities/auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class AuthRepository extends BaseRepository<AuthEntity> {
    constructor(
        @InjectRepository(AuthEntity)
        private repository: Repository<AuthEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
