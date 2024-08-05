import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'order' })
export class OrderEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar' })
    outcomeId: string;
}
