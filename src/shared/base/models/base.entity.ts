import {
    BaseEntity as TypeOrmBaseEntity,
    PrimaryColumn,
    CreateDateColumn,
    DeleteDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { v7 } from 'uuid';

export class BaseEntity extends TypeOrmBaseEntity {
    @PrimaryColumn()
    public id: string = v7();

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: number;

    @UpdateDateColumn({ type: 'timestamp' })
    public updatedAt: number;

    @DeleteDateColumn({ type: 'timestamp' })
    public deletedAt: number;
}
