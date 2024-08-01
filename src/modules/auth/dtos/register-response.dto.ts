import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
    @ApiProperty()
    id: string;
    @ApiProperty()
    username: string;
    @ApiProperty()
    address: string;
}
