export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository {
  store(userId: string, tokenHash: string, expiresInSeconds: number): Promise<void>;
  findHash(userId: string): Promise<string | null>;
  revoke(userId: string): Promise<void>;
}
