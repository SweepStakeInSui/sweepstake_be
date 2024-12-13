import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { Transform } from 'class-transformer';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { OutcomeEntity } from './outcome.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'share' })
export class ShareEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public outcomeId: string;

    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    public balance: bigint = 0n;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    public avgPrice: bigint = 0n;

    public reduceBalance(amount: bigint) {
        if (this.balance < amount) {
            throw new Error('Insufficient balance');
        }
        this.balance -= amount;
    }

    public addBalance(amount: bigint) {
        this.balance += amount;
    }

    public updateAvgPrice(amount: bigint, quantity: bigint) {
        this.avgPrice = (this.avgPrice * this.balance + amount * quantity) / (this.balance + quantity);
    }

    @ManyToOne(() => OutcomeEntity, { createForeignKeyConstraints: false })
    public outcome: OutcomeEntity;

    @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
    public user: UserEntity;
}
