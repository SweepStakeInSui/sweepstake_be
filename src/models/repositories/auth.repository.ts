import { AuthEntity } from '@models/entities/auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AuthRepository extends Repository<AuthEntity> {
    constructor(
        @InjectRepository(AuthEntity)
        private repository: Repository<AuthEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
