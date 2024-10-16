import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { CreateOrderRequestDto, CreateOrderResponseDto } from '../dtos/create-order.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { OrderEntity } from '@models/entities/order.entity';
import { GetOrdersResponseDto } from '../dtos/get-orders.dto';
import { Pagination } from 'nestjs-typeorm-paginate';

@ApiTags('order')
@UseGuards(AccessTokenGuard)
@Controller('order')
export class OrderController {
    constructor(
        private loggerService: LoggerService,
        private orderService: OrderService,
    ) {
        this.logger = this.loggerService.getLogger(OrderController.name);
    }

    private logger: Logger;

    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(CreateOrderResponseDto, EApiOkResponsePayload.OBJECT)
    public async createOrder(@Body() body: CreateOrderRequestDto, @CurrentUser() user: UserEntity) {
        const order = await this.orderService.createOrder(user, body);
        return order;
    }

    @Post('/cancel/:id')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(CreateOrderResponseDto, EApiOkResponsePayload.OBJECT)
    public async cancelOrder(@Param('id') id: string, @CurrentUser() user: UserEntity) {
        await this.orderService.cancelOrder(user, id);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponsePayload(GetOrdersResponseDto, EApiOkResponsePayload.OBJECT)
    async getOrders(
        @CurrentUser() user: UserEntity,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<Pagination<OrderEntity>> {
        return await this.orderService.paginate({ page, limit }, user.id);
    }
}
