import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeType } from '@modules/market/types/outcome';
import { MarketEntity } from './market.entity';

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

    @Column({ type: 'bigint' })
    askPrice: bigint;

    @Column({ type: 'bigint' })
    bidPrice: bigint;

    @Column({ type: 'bigint' })
    askLiquidity: bigint;

    @Column({ type: 'bigint' })
    bidLiquidity: bigint;

    @ManyToOne(() => MarketEntity, market => market.outcomes, { createForeignKeyConstraints: false })
    market: MarketEntity;
}
