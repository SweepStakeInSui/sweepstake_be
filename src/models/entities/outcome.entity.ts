import { Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity({ name: 'outcome' })
export class OutcomeEntity extends BaseEntity {}
