import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsSuiAddress } from '@shared/decorators/validators/address.validator';
import { IsEmail, IsString } from 'class-validator';
import { AuthType } from '../types/auth';

export type LoginPayload = EmailLoginPayload | WalletLoginPayload;

export class EmailLoginPayload {
    @ApiProperty({
        description: '',
    })
    @IsEmail()
    email: string;
    @ApiProperty({
        description: '',
    })
    @IsString()
    password: string;
}

export class WalletLoginPayload {
    @ApiProperty({
        description: 'user address',
    })
    @IsSuiAddress()
    address: string;
    @ApiProperty({
        description: 'signature signed by the private key of the address',
    })
    @IsString()
    signature: string;
}

@ApiExtraModels(EmailLoginPayload, WalletLoginPayload)
export class LoginRequestDto {
    @ApiProperty({
        description: 'login payload',
        oneOf: [{ $ref: getSchemaPath(EmailLoginPayload) }, { $ref: getSchemaPath(WalletLoginPayload) }],
    })
    payload: LoginPayload;
    @ApiProperty({
        description: 'login type',
        enum: AuthType,
    })
    type: AuthType;
}

export class LoginResponseDto {
    @ApiProperty()
    accessToken: string;
    @ApiProperty()
    refreshToken: string;
}
