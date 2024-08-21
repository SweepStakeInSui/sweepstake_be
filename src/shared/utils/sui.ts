import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
        const recoveredSigner = await verifyPersonalMessageSignature(Buffer.from(message), signature);
        if (address !== recoveredSigner.toSuiAddress()) {
            return false;
        }
        return true;
    } catch (e) {
        throw new Error('Failed to verify signature');
    }
}
