import { ApiProperty } from '@nestjs/swagger';

export class CategoryInput {
    @ApiProperty()
    name: string;
}
