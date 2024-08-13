import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { LoginRequestDto, LoginResponseDto } from '../dtos/login.dto';
import { GetNonceRequestDto, GetNonceResponseDto } from '../dtos/get-nonce.dto';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterRequestDto, RegisterResponseDto } from '../dtos/register.dto';
import { RefreshResponseDto, RefreshRequestDto } from '../dtos/refresh.dto';
import { LoginGuard } from '../guards/login.guard';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';

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

    @UseGuards(LoginGuard)
    @Post('login')
    @ApiOperation({
        description: 'Login with signature',
    })
    @ApiOkResponsePayload(LoginResponseDto, EApiOkResponsePayload.OBJECT)
    async login(@Body() body: LoginRequestDto, @Request() req): Promise<LoginResponseDto> {
        return await this.authService.login(req.user.userId);
    }

    @UseGuards(RefreshTokenGuard)
    @Get('refresh')
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(RefreshResponseDto, EApiOkResponsePayload.OBJECT)
    async refresh(@Body() body: RefreshRequestDto, @Request() req): Promise<RefreshResponseDto> {
        return await this.authService.refresh(req.user.userId, req.user.fingerprint);
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
