import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyGuard } from '@shared/guards/api-key.guard';
import { MockConfigService } from '@tests/mocks/config-service.mock';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';

describe('API key', () => {
    let guard: ApiKeyGuard;

    describe('API key', () => {
        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: ConfigService,
                        useValue: MockConfigService,
                    },
                ],
                controllers: [],
            }).compile();
            guard = new ApiKeyGuard(module.get<ConfigService>(ConfigService));
        });
        it('API key should be defined', async () => {
            expect(guard).toBeDefined();
        });

        it('API key should active', async () => {
            const context = createMock<ExecutionContext>();
            const canActivate = await guard.canActivate(context);

            expect(canActivate).toBe(true);
        });
    });
});
