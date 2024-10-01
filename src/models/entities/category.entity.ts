import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { MarketEntity } from '@models/entities/market.entity';

@Entity({ name: 'category' })
export class CategoryEntity extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @ManyToMany(() => MarketEntity, market => market.categories)
    markets: MarketEntity[];
}
