import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Logger } from 'log4js';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CategoryService } from '@modules/category/services/category.service';
import { CreateCategoryDto } from '@modules/category/dtos/create-category.dto';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/auth/guards/access-token.guard';
import { GetCategoryListDto, GetCategoryListResponseDto } from '@modules/category/dtos/get-category-list.dto';

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

    // Category

    @Get('/')
    @ApiOperation({
        description: 'Get category list',
    })
    @ApiOkResponsePayload(GetCategoryListDto, EApiOkResponsePayload.OBJECT, true)
    async getCategoryList(): Promise<GetCategoryListResponseDto> {
        return this.categoryService.getAllCategories();
    }

    @Get('/:id')
    @ApiOperation({
        description: 'Get category by id',
    })
    @ApiOkResponsePayload(CreateCategoryDto, EApiOkResponsePayload.OBJECT)
    async getCategoryById(@Param('id') id: string): Promise<CreateCategoryDto> {
        return this.categoryService.getCategoryById(id);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Create category',
    })
    @ApiOkResponsePayload(CreateCategoryDto, EApiOkResponsePayload.OBJECT)
    async createCategory(@Body() body: CreateCategoryDto): Promise<CreateCategoryDto> {
        return this.categoryService.createCategory(body.name);
    }

    @UseGuards(AccessTokenGuard)
    @Put('/:id')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Update category',
    })
    @ApiOkResponsePayload(CreateCategoryDto, EApiOkResponsePayload.OBJECT)
    async updateCategory(@Param('id') id: string, @Body() body: CreateCategoryDto): Promise<CreateCategoryDto> {
        return this.categoryService.updateCategory(id, body.name);
    }

    @UseGuards(AccessTokenGuard)
    @Delete('/:id')
    @ApiBearerAuth()
    @ApiOperation({
        description: 'Delete category',
    })
    @ApiOkResponsePayload(Boolean, EApiOkResponsePayload.OBJECT)
    async deleteCategory(@Param('id') id: string): Promise<boolean> {
        await this.categoryService.deleteCategory(id);
        return true;
    }
}
