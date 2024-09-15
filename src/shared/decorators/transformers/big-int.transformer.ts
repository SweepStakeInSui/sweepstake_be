import { BadRequestException } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';
import { ValueTransformer } from 'typeorm';

export function transformBigInt(params: TransformFnParams) {
    if (params.value == undefined) {
        return params.value;
    }
    if (typeof params.value !== 'string') {
        throw new BadRequestException(`${params.key} must be a string`);
    }
    return BigInt(params.value);
}

export const bigint: ValueTransformer = {
    to: (entityValue: bigint) => entityValue?.toString(),
    from: (databaseValue: string): bigint => (databaseValue ? BigInt(databaseValue) : undefined),
};
