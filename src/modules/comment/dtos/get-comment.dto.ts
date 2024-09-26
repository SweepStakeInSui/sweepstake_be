import { ApiProperty } from '@nestjs/swagger';
import { CommentEntity } from '@models/entities/comment.entity';

export class GetCommentRequestDto {
    @ApiProperty()
    id: string;
}

export class GetCommentResponseDto {
    @ApiProperty({ type: [CommentEntity] })
    comments: CommentEntity[];
}
