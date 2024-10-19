import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileRequestDto {
    @ApiProperty({
        description: 'username of user',
    })
    @IsOptional()
    @IsString()
    username: string;

    @ApiProperty({
        description: 'avatar of user',
    })
    @IsOptional()
    @IsString()
    avatar: string;
}
