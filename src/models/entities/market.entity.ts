import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeEntity } from './outcome.entity';
import { ConditionEntity } from './condition.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { Source } from '@modules/market/dtos/create-market.dto';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {
    @Index({ fulltext: true })
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    image?: string;

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'int' })
    startTime: number;

    @Column({ type: 'int' })
    endTime: number;

    @Column({ type: 'int' })
    payoutTime: number;

    @Column({ type: 'boolean', default: false })
    isActive: boolean;

    @Column({ type: 'varchar' })
    colaterralToken: string;

    @OneToMany(() => OutcomeEntity, outcome => outcome.market, { createForeignKeyConstraints: false })
    outcomes: OutcomeEntity[];

    @OneToMany(() => ConditionEntity, condition => condition.market, { createForeignKeyConstraints: false })
    conditions: ConditionEntity[];

    @Column({ type: 'simple-array', nullable: true })
    category?: string[];

    // TODO: remove this
    @Column({ type: 'text' })
    conditions_str: string;

    @Column({ type: 'json', nullable: true })
    sources?: Source[];

    @Column({ type: 'varchar', nullable: true })
    onchainId?: string;

    @Column({ type: 'varchar', nullable: true })
    transactionHash?: string;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    volume: bigint = 0n;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    tradeCount: bigint = 0n;

    // max 1000 = 100%, 1 = 0.1%,
    @Column({ type: 'bigint', transformer: bigint, default: 0n })
    @Transform(transformBigInt)
    percentage: bigint = 0n;
}
