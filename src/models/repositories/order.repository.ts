import { OrderEntity } from '@models/entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';

export class OrderRepository extends BaseRepository<OrderEntity> {
    constructor(
        @InjectRepository(OrderEntity)
        private repository: Repository<OrderEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
