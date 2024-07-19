import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload';
import { InvestorRepository } from '@models/repositories/investor.repository';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ethers } from 'ethers';
import { EEnvKey } from '@constants/env.constant';
import { Vesting__factory } from '@modules/contract/types';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private loggerService: LoggerService,
        private configService: ConfigService,
        private jwtService: JwtService,
        private investorRepository: InvestorRepository,
    ) {
        this.logger = this.loggerService.getLogger(AdminGuard.name);
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

            // check admin in contract

            const address: string = this.configService.get(EEnvKey.ADDR_VESTING);

            const provider = new ethers.JsonRpcProvider(this.configService.get(EEnvKey.RPC_URL)); // replace with your provider
            const contract = Vesting__factory.connect(address).connect(provider);
            console.log(ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE')));
            console.log(payload.address);
            const isAdmin = await contract.hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE')),
                payload.address,
            );
            console.log(isAdmin);

            if (!isAdmin) {
                throw new ForbiddenException();
            }

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['admin'] = payload.address;
        } catch (err) {
            this.logger.error(err);
            throw new ForbiddenException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
