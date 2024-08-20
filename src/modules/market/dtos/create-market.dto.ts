import { ApiProperty } from '@nestjs/swagger';
import { ConditionType } from '../types/condition';
import { CriteriaType } from '../types/criteria';
import { MarketInput } from '../types/market';

export class CreateMarketRequestDto extends MarketInput {
    @ApiProperty()
    conditions: ConditionInput[];
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
