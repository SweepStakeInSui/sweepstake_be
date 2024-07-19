import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

export class GetNonceRequestDto {
    @ApiProperty({ description: 'address of who want to login' })
    @IsEthereumAddress()
    address: string;
}
