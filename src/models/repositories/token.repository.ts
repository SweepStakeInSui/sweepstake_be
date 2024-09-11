import { TokenEntity } from '@models/entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class TokenRepository extends BaseRepository<TokenEntity> {
    constructor(
        @InjectRepository(TokenEntity)
        private repository: Repository<TokenEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
