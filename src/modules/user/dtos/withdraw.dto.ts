import { ApiProperty } from '@nestjs/swagger';

export class WithdrawRequestDto {
    @ApiProperty()
    amount: bigint;
    @ApiProperty()
    signature: string;
}

export class WithdrawResponseDto {}
