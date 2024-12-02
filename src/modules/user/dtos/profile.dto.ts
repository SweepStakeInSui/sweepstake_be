import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
    @ApiProperty()
    username: string;
    @ApiProperty()
    address?: string;
    @ApiProperty()
    avatar?: string;
    @ApiProperty()
    positionsValue?: number;
    @ApiProperty()
    pnl?: bigint;
    @ApiProperty()
    volume?: bigint;
    @ApiProperty()
    winRate?: number;
    @ApiProperty()
    rank?: number;
    @ApiProperty()
    balance: bigint;
}
