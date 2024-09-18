import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { TradeStatus } from '@modules/order/types/trade';

@Entity({ name: 'trade' })
export class TradeEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    makerOrderId: string;

    @Column({ type: 'varchar' })
    takerOrderId: string;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    amount: bigint;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    price: bigint;

    @Column({
        type: 'enum',
        enum: TradeStatus,
        default: TradeStatus.Pending,
    })
    status: TradeStatus;
}
