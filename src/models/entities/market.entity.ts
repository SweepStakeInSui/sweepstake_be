import { CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import BaseEntity from '@shared/base/models/base.entity';
import { v7 } from 'uuid';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {
    @PrimaryColumn()
    public id: string = v7();

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: number;

    @UpdateDateColumn({ type: 'timestamp' })
    public updatedAt: number;

    @DeleteDateColumn({ type: 'timestamp' })
    public deletedAt: number;
}
