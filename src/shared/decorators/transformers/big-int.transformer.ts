import { BadRequestException } from '@nestjs/common';
import { TransformFnParams } from 'class-transformer';

export function transformBigInt(params: TransformFnParams) {
    if (typeof params.value !== 'string') {
        throw new BadRequestException(`${params.key} must be a string`);
    }
    return BigInt(params.value);
}
