import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OrderSide, OrderStatus, OrderType } from '@modules/order/types/order';
import { OutcomeEntity } from './outcome.entity';

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

    @Column({ type: 'bigint' })
    amount: bigint;

    @Column({ type: 'bigint' })
    fullfilled: bigint = 0n;

    @Column({ type: 'bigint' })
    price: bigint;

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

    @ManyToOne(() => OutcomeEntity)
    outcome: OutcomeEntity;
}
