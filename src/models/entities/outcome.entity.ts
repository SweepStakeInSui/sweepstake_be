import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeType } from '@modules/market/types/outcome';
import { MarketEntity } from './market.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';

@Entity({ name: 'outcome' })
export class OutcomeEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    marketId: string;

    @Column({
        type: 'enum',
        enum: OutcomeType,
        default: OutcomeType.Yes,
    })
    type: OutcomeType;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    askPrice: bigint;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    bidPrice: bigint;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    askLiquidity: bigint;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    bidLiquidity: bigint;

    @ManyToOne(() => MarketEntity, market => market.outcomes, { createForeignKeyConstraints: false })
    market: MarketEntity;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    lastPrice: bigint = 0n;
}
