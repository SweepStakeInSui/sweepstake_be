import { IsWalletAddress, PlainBody } from '@shared/decorators/custom.decorator';

describe('Test custom decorator', () => {
    describe('Custom decorator', () => {
        it('check wallet address', () => {
            IsWalletAddress();
        });

        it('get current user', () => {
            PlainBody();
        });
    });
});
