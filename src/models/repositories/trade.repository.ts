import { TradeEntity } from '@models/entities/trade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class TradeRepository extends BaseRepository<TradeEntity> {
    constructor(
        @InjectRepository(TradeEntity)
        private repository: Repository<TradeEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
