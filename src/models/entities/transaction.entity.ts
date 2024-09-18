import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { TransactionStatus } from '@modules/chain/types/transaction';

@Entity({ name: 'transaction' })
export class TransactionEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public hash: string;

    @Column({ type: 'int', nullable: true })
    public block?: number;

    @Column({ type: 'varchar' })
    public address: string;

    @Column({ type: 'varchar' })
    public chainId: string;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.Built,
    })
    status: TransactionStatus;
}
