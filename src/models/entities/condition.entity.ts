import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { ConditionType } from '@modules/market/types/condition';

@Entity({ name: 'condition' })
export class ConditionEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    marketId: string;

    @Column({ type: 'varchar' })
    criteriaId: string;

    @Column({
        type: 'enum',
        enum: ConditionType,
        default: ConditionType.Equal,
    })
    type: ConditionType;

    @Column({ type: 'varchar' })
    value: string;
}
