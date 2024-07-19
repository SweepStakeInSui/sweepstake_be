import { PublicApi, CurrentUser } from '@shared/decorators/auth.decorator';

describe('auth decorator', () => {
    describe('auth decorator', () => {
        it('set public api', async () => {
            expect(PublicApi());
        });

        it('set public api', async () => {
            expect(CurrentUser());
        });
    });
});
