import { ApiProperty } from '@nestjs/swagger';
import { transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { IsOptional } from 'class-validator';
import { IsBigInt, MaxBigInt, MinBigInt } from 'class-validator-extended';
import { OrderSide, OrderType } from '../types/order';
import { Transform } from 'class-transformer';

export class CreateOrderRequestDto {
    @ApiProperty()
    outcomeId: string;

    @ApiProperty()
    @IsBigInt()
    @MinBigInt(0n)
    @Transform(transformBigInt)
    amount: bigint;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsBigInt()
    @MinBigInt(1_000n)
    @MaxBigInt(999_000n)
    @Transform(transformBigInt)
    price?: bigint;

    @ApiProperty({
        enum: OrderType,
        default: OrderType.FOK,
    })
    type: OrderType = OrderType.FOK;

    @ApiProperty({
        enum: OrderSide,
        default: OrderSide.Bid,
    })
    side: OrderSide;

    @ApiProperty({
        required: false,
        default: 0n,
    })
    @IsOptional()
    @IsBigInt()
    @MinBigInt(1n)
    @MaxBigInt(100n)
    @Transform(transformBigInt)
    slippage?: bigint = 1n;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    signature?: string;
}

export class CreateOrderResponseDto {}
