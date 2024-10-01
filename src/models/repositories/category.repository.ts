import { Repository } from 'typeorm';
import { CategoryEntity } from '@models/entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';

export class CategoryRepository extends BaseRepository<CategoryEntity> {
    constructor(
        @InjectRepository(CategoryEntity)
        private repository: Repository<CategoryEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
