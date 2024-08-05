import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    description: string;

    @Column({ type: 'timestamp' })
    startTime: string;

    @Column({ type: 'timestamp' })
    endTime: string;

    @Column({ type: 'varchar' })
    colaterralToken: string;
}
