import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OrderSide, OrderStatus, OrderType } from '@modules/order/types/order';
import { OutcomeEntity } from './outcome.entity';
import { bigint } from '@shared/decorators/transformers/big-int.transformer';

@Entity({ name: 'order' })
export class OrderEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar' })
    outcomeId: string;

    @Column({ type: 'varchar' })
    marketId: string;

    @Column({
        type: 'enum',
        enum: OrderType,
        default: OrderType.FOK,
    })
    type: OrderType;

    @Column({
        type: 'enum',
        enum: OrderSide,
        default: OrderSide.Bid,
    })
    side: OrderSide;

    @Column({ type: 'bigint', transformer: bigint })
    amount: bigint;

    @Column({ type: 'bigint', transformer: bigint })
    fullfilled: bigint = 0n;

    @Column({ type: 'bigint', transformer: bigint })
    price: bigint;

    // max 1000 = 100%
    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    slippage?: bigint;

    @Column({ type: 'varchar' })
    signature: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.Pending,
    })
    status: OrderStatus;

    @Column({ type: 'int' })
    timestamp: number;

    @ManyToOne(() => OutcomeEntity, { createForeignKeyConstraints: false })
    outcome: OutcomeEntity;
}
