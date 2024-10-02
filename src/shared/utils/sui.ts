import { SuiGraphQLClient } from '@mysten/sui/dist/cjs/graphql';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

export async function verifySignature(
    address: string,
    message: string,
    signature: string,
    options?: {
        client?: SuiGraphQLClient;
    },
): Promise<boolean> {
    try {
        const recoveredSigner = await verifyPersonalMessageSignature(Buffer.from(message), signature, {
            client: options.client,
        });
        if (address !== recoveredSigner.toSuiAddress()) {
            return false;
        }
        return true;
    } catch (e) {
        throw new Error('Failed to verify signature');
    }
}

export function buildTransactionTarget(address: string, module: string, target: string): string {
    return `${address}::${module}::${target}`;
}
