import { ApiProperty } from '@nestjs/swagger';

export class GetCategoryRequestDto {
    @ApiProperty()
    id: string;
}

export class GetCategoryResponseDto {}
