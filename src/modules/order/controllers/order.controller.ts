import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { CreateOrderRequestDto, CreateOrderResponseDto } from '../dtos/create-order.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserEntity } from '@models/entities/user.entity';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';

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
}
