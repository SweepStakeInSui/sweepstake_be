import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetTopVolumeResponseDto } from '../dtos/get-top-volume.dto';
import { PriceHistoryService } from '../services/price-history.service';
import { SnapshotTime } from '../types/snapshot.type';
import dayjs from 'dayjs';

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
    @ApiQuery({ name: 'start', required: true, type: Number })
    @ApiQuery({ name: 'end', required: true, type: Number })
    @ApiOkResponsePayload(GetTopVolumeResponseDto, EApiOkResponsePayload.OBJECT)
    async getTopVolume(
        @Query('start', new DefaultValuePipe(dayjs()), ParseIntPipe) start: number,
        @Query('end', new DefaultValuePipe(dayjs()), ParseIntPipe) end: number,
        @Query('time') time: SnapshotTime = SnapshotTime.OneMinute,
        @Param('marketId') marketId: string,
    ) {
        return await this.priceHistoryService.getPriceHistoy(marketId, time, start, end);
    }
}
