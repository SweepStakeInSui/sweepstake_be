import { ApiProperty } from '@nestjs/swagger';
import { IsSuiAddress } from '@shared/decorators/validators/address.validator';

export class GetNonceRequestDto {
    @ApiProperty({ description: 'address of who want to login' })
    @IsSuiAddress()
    address: string;
}

export class GetNonceResponseDto {
    @ApiProperty()
    nonce: string;
}
