import { sleep, delay } from '../../../shared/utils/promise';

describe('Promise utils', () => {
    describe('Promise testing', () => {
        it('should sleep 1000ms', async () => {
            await sleep(1000);
        });

        it('should delay 1000ms', async () => {
            await delay(1);
        });
    });
});
