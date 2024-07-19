export interface JwtPayload {}

export interface WalletJwtPayload extends JwtPayload {
    // userId: string;
    address: string;
}
