import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
    @ApiProperty()
    id: number;
    @ApiProperty()
    username: string;
}
