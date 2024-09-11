import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'chain' })
export class ChainEntity extends BaseEntity {
    @Column({ type: 'varchar', nullable: true })
    public name: string;

    @Column({ type: 'varchar' })
    public chainId: string;

    @Column({ type: 'int' })
    public block: number;
}
