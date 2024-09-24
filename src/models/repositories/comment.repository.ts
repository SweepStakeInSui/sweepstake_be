import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '@shared/base/models/base.repository';
import { Repository } from 'typeorm';
import { CommentEntity } from '@models/entities/comment.entity';

export class CommentRepository extends BaseRepository<CommentEntity> {
    constructor(
        @InjectRepository(CommentEntity)
        private repository: Repository<CommentEntity>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
