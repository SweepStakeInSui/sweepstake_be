import { ApiProperty } from '@nestjs/swagger';

export class DepositRequestDto {
    @ApiProperty()
    amount: bigint;
    @ApiProperty()
    signature: string;
}

export class DepositResponseDto {}
