import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import 'dotenv/config';

async function main(message: string) {
    const mnemonic = process.env.MNEMONIC;

    const keypair = await Ed25519Keypair.deriveKeypair(mnemonic);
    console.log(`Public key: ${keypair.getPublicKey().toSuiAddress()}`);

    const { signature } = await keypair.signPersonalMessage(Buffer.from(message));
    console.log(`Signature: ${signature}`);
}

// Get the message from command line arguments
const message = process.argv[2];
if (!message) {
    console.error('Please provide a message to sign.');
    process.exit(1);
}

main(message).catch(console.error);
