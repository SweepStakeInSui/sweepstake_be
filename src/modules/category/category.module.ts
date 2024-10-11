import { Module } from '@nestjs/common';
import { CategoryController } from '@modules/category/controllers/category.controller';
import { CategoryService } from '@modules/category/services/category.service';

const controllers = [CategoryController];
const services = [CategoryService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class CategoryModule {}
