import { TradeEntity } from '@models/entities/trade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class TradeRepository extends Repository<TradeEntity> {
    constructor(
        @InjectRepository(TradeEntity)
        private repository: Repository<TradeEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
