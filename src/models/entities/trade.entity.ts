import { Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'trade' })
export class TradeEntity extends BaseEntity {}
