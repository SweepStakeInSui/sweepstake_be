import { MarketEntity } from '@models/entities/market.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class MarketRepository extends Repository<MarketEntity> {
    constructor(
        @InjectRepository(MarketEntity)
        private repository: Repository<MarketEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
