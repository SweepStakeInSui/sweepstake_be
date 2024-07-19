import 'dotenv/config';
import { EEnvKey } from '@constants/env.constant';

export const MockConfigService = {
    get: jest.fn((key: EEnvKey) => {
        switch (key) {
            default:
                return null;
            case EEnvKey.IS_WRITE_LOG:
                return true;
            case EEnvKey.LOG_LEVEL:
                return 'info';
        }
    }),
};
