import { ApiProperty } from '@nestjs/swagger';
import { transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { IsSuiAddress } from '@shared/decorators/validators/address.validator';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { IsBigInt, MinBigInt } from 'class-validator-extended';

export class UserInput {
    @ApiProperty({
        description: 'username of user',
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'address of user wallet',
    })
    @IsSuiAddress()
    address: string;

    @ApiProperty({
        description: 'email of user',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'balance of user, present by 18 decimals, string, . E.g: "1000000000000000000" means 1',
    })
    @IsBigInt()
    @MinBigInt(0n)
    @Transform(transformBigInt)
    balance: bigint;
}

export class UserOutput {
    @ApiProperty({
        description: 'id of user',
    })
    id: number;

    @ApiProperty({
        description: 'username of user',
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'address of user wallet',
    })
    @IsSuiAddress()
    address: string;

    @ApiProperty({
        description: 'email of user',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'balance of user, present by 18 decimals, string, . E.g: "1000000000000000000" means 1',
    })
    @IsBigInt()
    @MinBigInt(0n)
    @Transform(transformBigInt)
    balance: bigint;
}
