import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload';
import { InvestorRepository } from '@models/repositories/investor.repository';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@Injectable()
export class InvestorGuard implements CanActivate {
    constructor(
        private loggerService: LoggerService,
        private configService: ConfigService,
        private jwtService: JwtService,
        private investorRepository: InvestorRepository,
    ) {
        this.logger = this.loggerService.getLogger(InvestorGuard.name);
    }

    private logger: Logger;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(token);

            const investor = await this.investorRepository.findOneBy({
                address: payload.address,
            });

            if (!investor) {
                throw new ForbiddenException();
            }

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['investor'] = investor;
        } catch {
            throw new ForbiddenException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
