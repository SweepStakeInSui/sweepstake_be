import { Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'order' })
export class OrderEntity extends BaseEntity {}
