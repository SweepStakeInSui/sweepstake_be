import { ApiProperty } from '@nestjs/swagger';
export class GetCommentRequestDto {
    @ApiProperty()
    id: string;
}

export class GetCommentResponseDto {}
