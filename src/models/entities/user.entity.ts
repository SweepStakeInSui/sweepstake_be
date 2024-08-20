import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    public username: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    public address: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    public email: string;

    @Column({ type: 'bigint' })
    public balance: bigint;
}
