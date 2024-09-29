import { ApiProperty } from '@nestjs/swagger';
import { transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { IsBigInt, MinBigInt } from 'class-validator-extended';

export class WithdrawRequestDto {
    @ApiProperty()
    @IsBigInt()
    @MinBigInt(0n)
    @Transform(transformBigInt)
    amount: bigint;
    @ApiProperty()
    address: string;
}

export class WithdrawResponseDto {}
