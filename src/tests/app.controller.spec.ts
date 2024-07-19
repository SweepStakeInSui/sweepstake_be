import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

describe('AppController', () => {
    let controller: AppController;

    describe('App controller', () => {
        it('app controller should be defined', async () => {
            const module: TestingModule = await Test.createTestingModule({
                controllers: [AppController],
                providers: [AppService],
            }).compile();

            controller = module.get<AppController>(AppController);

            expect(controller).toBeDefined();
        });
    });
});
