import { Module } from '@nestjs/common';
import { CommentController } from '@modules/comments/controllers/comment.controller';
import { CommentService } from '@modules/comments/services/comment.service';

const controllers = [CommentController];
const services = [CommentService];

@Module({
    imports: [],
    controllers: [...controllers],
    providers: [...services],
})
export class CommentModule {}
