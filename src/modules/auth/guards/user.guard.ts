import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { WalletJwtPayload } from '../types/jwt-payload';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { UserRepository } from '@models/repositories/user.repository';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(
        private loggerService: LoggerService,
        private configService: ConfigService,
        private jwtService: JwtService,
        private userRepository: UserRepository,
    ) {
        this.logger = this.loggerService.getLogger(UserGuard.name);
    }

    private logger: Logger;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload: WalletJwtPayload = await this.jwtService.verifyAsync(token);

            const user = await this.userRepository.findOneBy({
                address: payload.address,
            });

            if (!user) {
                throw new ForbiddenException();
            }

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = user;
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
