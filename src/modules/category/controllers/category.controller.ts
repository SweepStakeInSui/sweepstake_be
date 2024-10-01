import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CategoryService } from '@modules/category/services/category.service';
import { CreateCategoryDto } from '@modules/category/dtos/create-category.dto';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { CategoryEntity } from '@models/entities/category.entity';

@ApiTags('category')
@Controller('category')
export class CategoryController {
    constructor(
        private loggerService: LoggerService,
        private categoryService: CategoryService,
    ) {
        this.logger = this.loggerService.getLogger(CategoryController.name);
    }

    private logger: Logger;

    @Get('/')
    @ApiOperation({
        description: 'Get category list',
    })
    @ApiOkResponsePayload(CategoryEntity, EApiOkResponsePayload.OBJECT, true)
    async getCategoryList(): Promise<CategoryEntity[]> {
        return this.categoryService.getAllCategories();
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'create category',
    })
    @ApiOkResponsePayload(CreateCategoryDto, EApiOkResponsePayload.OBJECT)
    async createCategory(@Body() body: CreateCategoryDto): Promise<CreateCategoryDto> {
        return this.categoryService.createCategory(body.name);
    }
}
