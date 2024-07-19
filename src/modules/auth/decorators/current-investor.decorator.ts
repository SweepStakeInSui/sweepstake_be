import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentInvestor = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const investor = ctx.switchToHttp().getRequest().investor;

    if (!investor) {
        return null;
    }

    return data ? investor[data] : investor; // extract a specific property only if specified or get a user object
});
