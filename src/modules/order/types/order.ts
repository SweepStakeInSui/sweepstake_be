import { ApiProperty } from '@nestjs/swagger';
import { transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { IsBigInt, MinBigInt } from 'class-validator-extended';

export enum OrderType {
    // Market Order - order will be filled at the best available price
    'FOK' = 'FOK', // Fill or Kill - order must be filled immediately and entirely or it will be cancelled
    // Limit Order - order will be filled at the specified price or better
    'GTC' = 'GTC', // Good Till Cancelled - order will be active until it is filled or cancelled
    'GTD' = 'GTD', // Good Till Date - order will be active until it is filled, cancelled, or until the specified date
}

export enum OrderSide {
    'Bid' = 'Bid',
    'Ask' = 'Ask',
}

export enum OrderStatus {
    'Pending' = 'Pending',
    'Matching' = 'Matching',
    'Filled' = 'Filled',
    'Completed' = 'Completed',
    'Cancelled' = 'Cancelled',
}

export class OrderInput {
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
    @MinBigInt(0n)
    @Transform(transformBigInt)
    price?: bigint;

    @ApiProperty({
        enum: OrderType,
        default: OrderType.FOK,
    })
    type: OrderType = OrderType.FOK;

    // @ApiProperty({
    //     enum: OrderSide,
    //     default: OrderSide.Bid,
    // })
    // side: OrderSide;

    @ApiProperty()
    signature: string;
}
