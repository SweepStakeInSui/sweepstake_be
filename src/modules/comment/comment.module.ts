import { Module } from '@nestjs/common';
import { CommentController } from './controllers/comment.controller';
import { CommentService } from './services/comment.service';

const controllers = [CommentController];
const services = [CommentService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class CommentModule {}
