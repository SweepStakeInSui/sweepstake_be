import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import BaseEntity from '@shared/base/models/base.entity';
import { AuthType } from '@modules/auth/types/auth';
import { v7 } from 'uuid';

@Entity({ name: 'auth' })
export class AuthEntity extends BaseEntity {
    @PrimaryColumn()
    public id: string = v7();

    @Column()
    public userId: string;

    @Column({ type: 'enum', enum: AuthType, default: AuthType.Wallet })
    public type: AuthType;

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: number;

    @UpdateDateColumn({ type: 'timestamp' })
    public updatedAt: number;

    @DeleteDateColumn({ type: 'timestamp' })
    public deletedAt: number;
}
