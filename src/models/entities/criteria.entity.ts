import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { CriteriaStatus, CriteriaType } from '@modules/market/types/criteria';

@Entity({ name: 'criteria' })
export class CriteriaEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({
        type: 'enum',
        enum: CriteriaType,
        default: CriteriaType.Bool,
    })
    type: CriteriaType;

    @Column({ type: 'varchar', default: '' })
    value: string;

    @Column({ type: 'enum', enum: CriteriaStatus, default: CriteriaStatus.Pending })
    status: CriteriaStatus;
}
