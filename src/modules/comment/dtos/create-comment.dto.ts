import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentRequestDto {
    @ApiProperty()
    @IsString()
    marketId: string;

    @ApiProperty()
    @IsString()
    @Length(1, 800)
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    parentCommentId?: string;
}

export class CreateCommentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class UpdateCommentDto {
    @ApiProperty()
    @IsString()
    content: string;
}
