import { Module } from '@nestjs/common';
import { CommentService } from './services/comment.service';

const services = [CommentService];

@Module({
    imports: [],
    controllers: [],
    providers: [...services],
})
export class CommentModule {}
