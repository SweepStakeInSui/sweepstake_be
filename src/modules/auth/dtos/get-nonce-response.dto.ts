import { ApiProperty } from '@nestjs/swagger';

export class GetNonceResponseDto {
    @ApiProperty()
    nonce: string;
}
