import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { Transform } from 'class-transformer';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';

@Entity({ name: 'share' })
export class ShareEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public outcomeId: string;

    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    public balance: bigint = 0n;

    public reduceBalance(amount: bigint) {
        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }
        this.balance -= amount;
    }

    public addBalance(amount: bigint) {
        this.balance += amount;
    }
}
