import { IResponse } from '@shared/interceptors/request-response.interceptor';

export function formatResponseSuccess<T>(response: IResponse<T>) {
    return response;
}
