import { UserEntity } from '@models/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class UserRepository extends BaseRepository<UserEntity> {
    constructor(
        @InjectRepository(UserEntity)
        private repository: Repository<UserEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
