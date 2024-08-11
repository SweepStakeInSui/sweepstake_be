import { ApiProperty } from '@nestjs/swagger';

export class RefreshRequestDto {
    @ApiProperty({
        description: 'refresh token',
    })
    refreshToken: string;
}

export class RefreshResponseDto {
    @ApiProperty()
    accessToken: string;
    @ApiProperty()
    refreshToken: string;
}
