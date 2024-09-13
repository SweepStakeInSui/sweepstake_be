import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { ConditionType } from '@modules/market/types/condition';
import { MarketEntity } from './market.entity';

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

    @ManyToOne(() => MarketEntity, market => market.conditions, { createForeignKeyConstraints: false })
    market: MarketEntity;
}
