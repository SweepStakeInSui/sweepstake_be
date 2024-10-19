import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    public username: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    public address?: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    public email?: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    public avatar?: string;

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
