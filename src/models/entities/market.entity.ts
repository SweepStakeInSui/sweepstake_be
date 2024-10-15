import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeEntity } from './outcome.entity';
import { ConditionEntity } from './condition.entity';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {
    @Index({ fulltext: true })
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'int' })
    startTime: number;

    @Column({ type: 'int' })
    endTime: number;

    @Column({ type: 'boolean', default: false })
    isActive: boolean;

    @Column({ type: 'varchar' })
    colaterralToken: string;

    @OneToMany(() => OutcomeEntity, outcome => outcome.market, { createForeignKeyConstraints: false })
    outcomes: OutcomeEntity[];

    @OneToMany(() => ConditionEntity, condition => condition.market, { createForeignKeyConstraints: false })
    conditions: ConditionEntity[];

    @Column({ type: 'simple-array', nullable: true })
    categoryIds?: string[];

    // TODO: remove this
    @Column({ type: 'varchar' })
    conditions_str: string;

    @Column({ type: 'varchar', nullable: true })
    onchainId?: string;

    @Column({ type: 'varchar', nullable: true })
    transactionHash?: string;
}
