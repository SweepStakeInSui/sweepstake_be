import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetTopVolumeResponseDto } from '../dtos/get-top-volume.dto';
import { PriceHistoryService } from '../services/price-history.service';
import { SnapshotTime } from '../types/snapshot.type';

@Controller('price-history')
export class PriceHistoryController {
    private logger: Logger;

    constructor(
        private loggerService: LoggerService,
        private readonly priceHistoryService: PriceHistoryService,
    ) {
        this.logger = this.loggerService.getLogger(PriceHistoryController.name);
    }

    @Get('/:marketId')
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetTopVolumeResponseDto, EApiOkResponsePayload.OBJECT)
    async getTopVolume(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('time') time: SnapshotTime = SnapshotTime.OneMinute,
        @Param('marketId') marketId: string,
    ) {
        return await this.priceHistoryService.getPriceHistoy({ page, limit }, marketId, time);
    }
}
