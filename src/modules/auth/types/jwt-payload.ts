export interface BaseJwtPayload {
    userId: string;
}

export interface WalletJwtPayload extends BaseJwtPayload {
    // address: string;
}

export type JwtPayload = BaseJwtPayload | WalletJwtPayload;

export interface RefreshJwtPayload extends BaseJwtPayload {
    fingerprint: string;
}
