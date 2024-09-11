import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { AuthType } from '@modules/auth/types/auth';
import { UserEntity } from './user.entity';

@Entity({ name: 'auth' })
export class AuthEntity extends BaseEntity {
    @Column()
    public userId: string;

    @Column({ type: 'enum', enum: AuthType, default: AuthType.Wallet })
    public type: AuthType;

    @Column({ nullable: true })
    public address: string;

    @Column({ nullable: true })
    public email: string;

    @Column({ nullable: true })
    public passwordHash: string;

    @Column()
    public isActive: boolean;

    @ManyToOne(() => UserEntity)
    user: UserEntity;
}
