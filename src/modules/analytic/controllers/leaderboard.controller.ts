import { Logger } from 'log4js';
import { LeaderboardService } from '../services/leaderboard.services.';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetTopVolumeResponseDto } from '../dtos/get-top-volume.dto';
import { LeaderboardPeriod } from '../types/leaderboard.type';

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
    async getVolumeLeaderboard(
        @Query('period') period: LeaderboardPeriod = LeaderboardPeriod.All,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ) {
        return await this.leaderboardService.getVolumeLeaderboard(period, limit);
    }

    @Get('profit')
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetTopVolumeResponseDto, EApiOkResponsePayload.OBJECT)
    async getTopProfit(
        @Query('period') period: LeaderboardPeriod = LeaderboardPeriod.All,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ) {
        return await this.leaderboardService.getPnlLeaderboard(period, limit);
    }
}
