import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CommentInput {
    @ApiProperty()
    marketName: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    @IsNumber()
    time: number;

    @ApiProperty()
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    parentCommentId?: number;
}
