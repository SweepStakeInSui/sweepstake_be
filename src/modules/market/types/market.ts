import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class MarketInput {
    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    @IsNumber()
    startTime: string;

    @ApiProperty()
    @IsNumber()
    endTime: string;

    @ApiProperty()
    colaterralToken: string;
}
