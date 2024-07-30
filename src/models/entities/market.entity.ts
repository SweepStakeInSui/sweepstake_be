import { Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'market' })
export class MarketEntity extends BaseEntity {}
