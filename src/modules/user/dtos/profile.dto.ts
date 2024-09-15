import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
    @ApiProperty()
    username: string;
    @ApiProperty()
    address: string;
    @ApiProperty()
    avatar?: string;
    @ApiProperty()
    positionsValue?: number;
    @ApiProperty()
    pnl?: number;
    @ApiProperty()
    volume?: number;
    @ApiProperty()
    winRate?: number;
    @ApiProperty()
    rank?: number;
    @ApiProperty()
    balance: bigint;
}
