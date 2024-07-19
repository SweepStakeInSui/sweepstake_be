import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import BaseEntity from '@shared/base/models/base.entity';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'varchar', unique: true })
    username: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    address: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    email: string;

    @Column({ type: 'varchar' })
    balance: bigint;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: number;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: number;

    @DeleteDateColumn({ type: 'timestamp' })
    deletedAt: number;
}
