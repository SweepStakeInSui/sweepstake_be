import { Module } from '@nestjs/common';
import { CategoryService } from '@modules/category/services/category.service';

const services = [CategoryService];

@Module({
    imports: [],
    controllers: [],
    providers: [...services],
})
export class CategoryModule {}
