import { ApiProperty } from '@nestjs/swagger';

export class DepositRequestDto {
    @ApiProperty()
    txBytes: string;
    @ApiProperty({
        type: 'array',
        items: {
            type: 'string',
        },
    })
    signature: string[];
}

export class DepositResponseDto {}
