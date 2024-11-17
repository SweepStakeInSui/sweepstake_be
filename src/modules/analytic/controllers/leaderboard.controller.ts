import { Logger } from 'log4js';
import { LeaderboardService } from '../services/leaderboard.services.';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetTopVolumeResponseDto } from '../dtos/get-top-volume.dto';

@Controller('leaderboard')
export class LeaderboardController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly leaderboardService: LeaderboardService,
    ) {
        this.logger = this.loggerService.getLogger(LeaderboardController.name);
    }

    @Get('volume')
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetTopVolumeResponseDto, EApiOkResponsePayload.OBJECT)
    async getTopVolume(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ) {
        return await this.leaderboardService.getTopVolume({ page, limit });
    }

    @Get('profit')
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetTopVolumeResponseDto, EApiOkResponsePayload.OBJECT)
    async getTopProfit(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ) {
        return await this.leaderboardService.getTopVolume({ page, limit });
    }
}
