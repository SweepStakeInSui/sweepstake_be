import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CommentInput {
    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty()
    @IsString()
    marketId: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    parentCommentId?: number;
}
