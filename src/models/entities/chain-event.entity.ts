import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'chain-event' })
export class ChainEventEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public chainId: string;

    @Column({ type: 'varchar' })
    public name: string;

    @Column({ type: 'varchar' })
    public address: string;
}
