import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { TokenEntity } from './token.entity';

@Entity({ name: 'balance' })
export class BalanceEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'varchar' })
    public tokenId: string;

    @Column({ type: 'bigint' })
    public amount: bigint;

    @ManyToOne(() => TokenEntity)
    public token: TokenEntity;
}
