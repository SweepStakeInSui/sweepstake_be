import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeEntity } from './outcome.entity';
import { ConditionEntity } from './condition.entity';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    description: string;

    @Column({ type: 'int' })
    startTime: number;

    @Column({ type: 'int' })
    endTime: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'varchar' })
    colaterralToken: string;

    @OneToMany(() => OutcomeEntity, outcome => outcome.market)
    outcomes: OutcomeEntity[];

    @OneToMany(() => ConditionEntity, condition => condition.market)
    conditions: ConditionEntity[];
}
