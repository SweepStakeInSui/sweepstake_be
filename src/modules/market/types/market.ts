import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class MarketInput {
    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    @IsNumber()
    startTime: number;

    @ApiProperty()
    @IsNumber()
    endTime: number;

    @ApiProperty()
    colaterralToken: string;

    @ApiProperty()
    category: string[];
}
