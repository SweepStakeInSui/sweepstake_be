import { ethers } from 'ethers';

export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    const recoveredSigner = ethers.recoverAddress(ethers.hashMessage(message), signature);
    if (address !== recoveredSigner) {
        return false;
    }
    return true;
}
