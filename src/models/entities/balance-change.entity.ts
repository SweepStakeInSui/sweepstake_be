import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import dayjs from 'dayjs';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { BalanceChangeStatus, BalanceChangeType } from '@modules/user/types/balance-change.type';

@Entity({ name: 'balance-change' })
export class BalanceChangeEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public userId: string;

    @Column({
        type: 'enum',
        enum: BalanceChangeType,
        default: BalanceChangeType.Deposit,
    })
    type: BalanceChangeType;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    amount: bigint;

    @Column({ type: 'int', default: dayjs().unix() })
    timestamp: number;

    @Column({
        type: 'enum',
        enum: BalanceChangeStatus,
        default: BalanceChangeStatus.Pending,
    })
    status: BalanceChangeStatus;

    @Column({ type: 'varchar', nullable: true })
    transactionHash?: string;
}
