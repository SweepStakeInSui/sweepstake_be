import { ConditionType } from '../types/condition';
import { CriteriaType } from '../types/criteria';
import { MarketInput } from '../types/market';

export class CreateMarketRequestDto extends MarketInput {
    conditions: ConditionInput[];
}

export class CreateMarketResponseDto {}

export class ConditionInput {
    criteria: CriteriaInput;
    value: string;
    type: ConditionType;
}

export class CriteriaInput {
    name: string;
    type: CriteriaType;
    value: string;
}
