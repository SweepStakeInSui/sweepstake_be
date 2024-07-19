import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
    ApiExtraModels,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProperty,
    getSchemaPath,
} from '@nestjs/swagger';
import { ApiOperationOptions } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiPropertyOptions } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { EmptyResponse } from '@shared/dto/empty-reponse';
import { IResponse } from '@shared/interceptors/request-response.interceptor';
import { IPaginationMetadata } from '@shared/utils/pagination';

export * from '@nestjs/swagger';

export function enumToObj(enumVariable: Record<string, any>): Record<string, any> {
    const enumValues = Object.values(enumVariable);
    const hLen = enumValues.length / 2;
    const object = {};
    for (let i = 0; i < hLen; i++) {
        object[enumValues[i]] = enumValues[hLen + i];
    }
    return object;
}

export function enumProperty(options: ApiPropertyOptions): ApiPropertyOptions {
    const obj = enumToObj(options.enum);
    const enumValues = Object.values(obj);
    return {
        example: enumValues[0],
        ...options,
        enum: enumValues,
        description: (options.description ?? '') + ': ' + JSON.stringify(obj),
    };
}

const createApiOperation = (defaultOptions: ApiOperationOptions) => {
    return (options?: ApiOperationOptions): MethodDecorator =>
        ApiOperation({
            ...defaultOptions,
            ...options,
        });
};

export const ApiEnumProperty = (options: ApiPropertyOptions) => ApiProperty(enumProperty(options));
export const ApiListOperation = createApiOperation({
    summary: 'List all',
});
export const ApiRetrieveOperation = createApiOperation({
    summary: 'Get data 1 record',
});
export const ApiCreateOperation = createApiOperation({
    summary: 'Create new record',
});
export const ApiUpdateOperation = createApiOperation({
    summary: 'Edit record',
});
export const ApiDeleteOperation = createApiOperation({
    summary: 'Delete record',
});
export const ApiBulkDeleteOperation = createApiOperation({
    summary: 'Delete many record',
});

export enum EApiOkResponsePayload {
    ARRAY = 'array',
    OBJECT = 'object',
}
export const ApiOkResponsePayload = <DataDto extends Type<unknown>>(
    dto: DataDto,
    type: EApiOkResponsePayload = EApiOkResponsePayload.ARRAY,
    withPagination = false,
) => {
    const data =
        type === EApiOkResponsePayload.ARRAY
            ? {
                  type: EApiOkResponsePayload.ARRAY,
                  items: { $ref: getSchemaPath(dto) },
              }
            : {
                  type: EApiOkResponsePayload.OBJECT,
                  properties: {
                      data: { $ref: getSchemaPath(dto) },
                  },
              };

    const properties =
        type === EApiOkResponsePayload.ARRAY
            ? {
                  properties: {
                      data: data,
                  },
              }
            : { ...data };

    return applyDecorators(
        ApiExtraModels(!withPagination ? ResponseOkPayload : ResponseOkPaginationPayload, dto),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(!withPagination ? ResponseOkPayload : ResponseOkPaginationPayload) },
                    {
                        ...properties,
                    },
                ],
            },
        }),
    );
};

export const ApiInternalServerErrorResponsePayload = () => {
    return applyDecorators(
        ApiExtraModels(ResponseInternalServerErrorPayload, EmptyResponse),
        ApiInternalServerErrorResponse({
            schema: {
                allOf: [{ $ref: getSchemaPath(ResponseInternalServerErrorPayload) }, {}],
            },
        }),
    );
};

export const ApiForbiddenResponsePayload = () => {
    return applyDecorators(
        ApiExtraModels(ResponseForBiddenPayload, EmptyResponse),
        ApiForbiddenResponse({
            schema: {
                allOf: [{ $ref: getSchemaPath(ResponseForBiddenPayload) }, {}],
            },
        }),
    );
};

export class ResponseInternalServerErrorPayload<T> implements IResponse<T> {
    @ApiEnumProperty({ enum: HttpStatus, example: HttpStatus.INTERNAL_SERVER_ERROR })
    statusCode?: HttpStatus;
    @ApiProperty()
    data?: T;
    @ApiProperty({
        example: {
            message:
                'failed to send transaction: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit.',
        },
    })
    meta?: {
        message: string;
    };
}

export class ResponseForBiddenPayload<T> implements IResponse<T> {
    @ApiEnumProperty({ enum: HttpStatus, example: HttpStatus.FORBIDDEN })
    statusCode?: HttpStatus;
    @ApiProperty()
    data?: T;
    @ApiProperty({ example: { message: 'Forbidden resource' } })
    meta?: {
        message: string;
    };
}

export class ResponseOkPayload<T> implements IResponse<T> {
    @ApiEnumProperty({ enum: HttpStatus, example: HttpStatus.OK })
    statusCode?: HttpStatus;
    @ApiProperty()
    data?: T;
    @ApiProperty()
    meta?: {
        message: string;
        [key: string]: any;
    };
}
export class PaginationMetadata implements IPaginationMetadata {
    @ApiProperty({ description: 'the total amount of items' })
    totalItems: number;

    @ApiProperty({ description: 'the current page this paginator “points” to' })
    currentPage: number;

    @ApiProperty({ description: 'the amount of items on this specific page (i.e., the amount of items on this page)' })
    itemCount: number;

    @ApiProperty({ description: 'the total amount of pages in this paginator (i.e., the limit parameter)' })
    itemsPerPage: number;
}
export class ResponseOkPaginationPayload<T> extends ResponseOkPayload<T> {
    @ApiProperty({ type: PaginationMetadata })
    declare meta?: {
        message: string;
        pagination: IPaginationMetadata;
    };
}
