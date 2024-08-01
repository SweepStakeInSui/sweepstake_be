import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { GetNonceRequestDto } from '../dtos/get-nonce-request.dto';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { AuthService } from '../services/auth.service';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { GetNonceResponseDto } from '../dtos/get-nonce-response.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly authService: AuthService,
    ) {
        this.logger = this.loggerService.getLogger(AuthController.name);
    }

    @Post('nonce')
    @ApiOperation({
        description: 'Get nonce to login',
    })
    @ApiOkResponsePayload(GetNonceResponseDto, EApiOkResponsePayload.OBJECT)
    async getNonce(@Body() body: GetNonceRequestDto): Promise<GetNonceResponseDto> {
        this.logger.info(body.address);

        const nonce = await this.authService.getNonce(body.address);
        return {
            nonce,
        };
    }

    @Post('login')
    @ApiOperation({
        description: 'Login with signature',
    })
    @ApiOkResponsePayload(LoginResponseDto, EApiOkResponsePayload.OBJECT)
    async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
        const { payload, type } = body;
        this.logger.info(body.payload);
        const token = await this.authService.login(type, payload);
        return { token: token.accessToken };
    }

    @Post('register')
    @ApiOperation({})
    async register(@Body() body: RegisterRequestDto): Promise<RegisterResponseDto> {
        const { payload, type } = body;
        this.logger.info(body.payload);
        const userInfo = await this.authService.register(type, payload);
        return {
            id: userInfo.id,
            username: userInfo.username,
            address: userInfo.address,
        };
    }
}
