import { OrderEntity } from '@models/entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class OrderRepository extends Repository<OrderEntity> {
    constructor(
        @InjectRepository(OrderEntity)
        private repository: Repository<OrderEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
