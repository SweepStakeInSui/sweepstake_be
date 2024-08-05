import { ApiProperty } from '@nestjs/swagger';

export class GetMarketRequestDto {
    @ApiProperty()
    id: string;
}

export class GetMarketResponseDto {}
