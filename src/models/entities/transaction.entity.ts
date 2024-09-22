import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { TransactionStatus } from '@modules/chain/types/transaction';

@Entity({ name: 'transaction' })
export class TransactionEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public hash: string;

    @Column({ type: 'varchar', nullable: true })
    public block?: string;

    @Column({ type: 'varchar', nullable: true })
    public sender?: string;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.Sent,
    })
    status: TransactionStatus;
}
