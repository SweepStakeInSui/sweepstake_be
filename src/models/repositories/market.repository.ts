import { MarketEntity } from '@models/entities/market.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class MarketRepository extends BaseRepository<MarketEntity> {
    constructor(
        @InjectRepository(MarketEntity)
        private repository: Repository<MarketEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
