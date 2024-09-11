import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'token' })
export class TokenEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public name: string;

    @Column({ type: 'varchar' })
    public symbol: string;

    @Column({ type: 'int' })
    public decimals: number;

    @Column({ type: 'varchar' })
    public address: string;

    @Column({ type: 'varchar' })
    public chainId: string;
}
