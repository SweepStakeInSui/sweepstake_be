import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { CriteriaType } from '@modules/market/types/criteria';

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

    @Column({ type: 'varchar' })
    value: string;
}
