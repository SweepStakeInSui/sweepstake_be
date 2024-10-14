import { ApiProperty } from '@nestjs/swagger';

export class SeenRequestDto {
    @ApiProperty()
    notificationId: string;
}

export class SeenResponseDto {}
