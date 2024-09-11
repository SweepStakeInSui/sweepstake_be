import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { TransactionStatus } from '@modules/chain/types/transaction';

@Entity({ name: 'transaction' })
export class TransactionEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public hash: string;

    @Column({ type: 'int64' })
    public block: number;

    @Column({ type: 'varchar' })
    public chainId: string;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.Pending,
    })
    status: TransactionStatus;
}
