import { ApiProperty } from '@nestjs/swagger';
import { ConditionType } from '../types/condition';
import { CriteriaType } from '../types/criteria';
import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMarketRequestDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsOptional()
    @IsUrl()
    image?: string;

    @ApiProperty()
    @IsNumber()
    startTime: number;

    @ApiProperty()
    @IsNumber()
    endTime: number;

    @ApiProperty()
    colaterralToken: string;

    @ApiProperty()
    @IsOptional()
    category?: string[];

    @ApiProperty()
    conditions: string;
    // conditions: ConditionInput[];

    @ApiProperty()
    @IsOptional()
    @IsUrl()
    source?: string;
}

export class CreateMarketResponseDto {}

export class ConditionInput {
    @ApiProperty()
    criteria: CriteriaInput;
    @ApiProperty()
    value: string;
    @ApiProperty()
    type: ConditionType;
}

export type CriteriaInput = NewCriteriaInput | CriteriaId;

export class NewCriteriaInput {
    @ApiProperty()
    name: string;
    @ApiProperty()
    type: CriteriaType;
}

export class CriteriaId {
    @ApiProperty()
    id: string;
}
