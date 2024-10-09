import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'category' })
export class CategoryEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;
}
