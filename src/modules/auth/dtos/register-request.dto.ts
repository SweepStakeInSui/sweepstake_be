import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsSuiAddress } from '@shared/decorators/validators/address.validator';
import { IsEmail, IsString } from 'class-validator';
import { AuthType } from '../types/auth';

export type RegisterPayload = EmailRegisterPayload | WalletRegisterPayload;

export class EmailRegisterPayload {
    @IsEmail()
    email: string;
    @IsString()
    password: string;
}

export class WalletRegisterPayload {
    @IsSuiAddress()
    address: string;
    @ApiProperty({
        description: 'signature signed by the private key of the address',
    })
    @IsString()
    signature: string;
}

@ApiExtraModels(EmailRegisterPayload, WalletRegisterPayload)
export class RegisterRequestDto {
    @ApiProperty({
        description: 'register payload',
        oneOf: [{ $ref: getSchemaPath(EmailRegisterPayload) }, { $ref: getSchemaPath(WalletRegisterPayload) }],
    })
    payload: RegisterPayload;
    @ApiProperty({
        description: 'register type',
        enum: AuthType,
    })
    type: AuthType;
}
