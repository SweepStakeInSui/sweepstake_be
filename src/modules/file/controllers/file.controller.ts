import {
    Controller,
    FileTypeValidator,
    MaxFileSizeValidator,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';

@ApiTags('file')
@Controller('file')
export class FileController {
    private logger: Logger;

    constructor(private loggerService: LoggerService) {
        this.logger = this.loggerService.getLogger(FileController.name);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    public async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // Limit file size to 5MB
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        console.log(file);
        return {
            source: file.path,
        };
    }
}
