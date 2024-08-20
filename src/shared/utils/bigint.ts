Object.defineProperty(BigInt.prototype, 'toJSON', {
    get() {
        'use strict';
        return () => String(this);
    },
});

export class BigIntUtil {
    static max(...args: bigint[]): bigint {
        return args.reduce((m, e) => (e > m ? e : m));
    }

    static min(...args: bigint[]): bigint {
        return args.reduce((m, e) => (e < m ? e : m));
    }
}
