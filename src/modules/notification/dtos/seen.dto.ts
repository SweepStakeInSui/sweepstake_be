import { ApiProperty } from '@nestjs/swagger';

export class SeenRequestDto {
    @ApiProperty()
    notificationIds: string[];
}

export class SeenResponseDto {}
