import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OrderSide, OrderStatus, OrderType } from '@modules/order/types/order';
import { OutcomeEntity } from './outcome.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { MarketEntity } from './market.entity';
import { UserEntity } from './user.entity';

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
    @Transform(transformBigInt)
    amount: bigint;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    fullfilled: bigint = 0n;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    price?: bigint;

    // max 1000 = 100%, 1 = 0.1%,
    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
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

    @ManyToOne(() => MarketEntity, { createForeignKeyConstraints: false })
    market: MarketEntity;

    @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
    user: UserEntity;
}
