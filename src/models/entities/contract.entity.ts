import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'contract' })
export class ContractEntity extends BaseEntity {
    @Column({ type: 'varchar', nullable: true })
    public name?: string;

    @Column({ type: 'varchar' })
    public address: string;
}
