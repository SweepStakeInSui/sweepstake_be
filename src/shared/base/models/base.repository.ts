import { Repository } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

export class BaseRepository<E extends BaseEntity> extends Repository<E> {}
