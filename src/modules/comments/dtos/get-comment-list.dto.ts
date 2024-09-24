import { Pagination } from 'nestjs-typeorm-paginate';
import { CommentEntity } from '@models/entities/comment.entity';

export class GetCommentListRequestDto {}

export class GetCommentListResponseDto extends Pagination<CommentEntity> {}
