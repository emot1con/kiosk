import { Injectable, UnauthorizedException, ConflictException, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUserRepository } from '../domain/ports/user-repository.port';
import { USER_REPOSITORY } from '../domain/ports/user-repository.port';
import type { IHashService } from '../domain/ports/hash-service.port';
import { HASH_SERVICE } from '../domain/ports/hash-service.port';
import type { IRefreshTokenRepository } from '../domain/ports/refresh-token-repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/ports/refresh-token-repository.port';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async getTokens(userId: string, email: string) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION') || '1d';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    const refreshExpirationStr = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '30d';
    const expiresInSeconds = 30 * 24 * 60 * 60; // 30 days default

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: jwtSecret, expiresIn: jwtExpiration as any },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: refreshSecret, expiresIn: refreshExpirationStr as any },
      ),
    ]);

    const refreshTokenHash = await this.hashService.hash(refreshToken);
    await this.refreshTokenRepository.store(userId, refreshTokenHash, expiresInSeconds);

    return { accessToken, refreshToken };
  }

  private generateApiKeyPlain(): string {
    return 'sk_live_' + randomBytes(24).toString('base64url');
  }

  async register(email: string, passwordPlain: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration attempt failed: email already exists (${email})`);
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashService.hash(passwordPlain);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      apiKeyHash: null,
      apiKeyPrefix: null,
    });

    const tokens = await this.getTokens(user.id, user.email);

    this.logger.log(`User registered successfully: userId=${user.id}, email=${user.email}`);

    return {
      user: { id: user.id, email: user.email, apiKeyPrefix: user.apiKeyPrefix },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(email: string, passwordPlain: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt failed: user not found (${email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashService.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: invalid password for user (${email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email);

    this.logger.log(`User logged in successfully: userId=${user.id}`);

    return {
      user: { id: user.id, email: user.email, apiKeyPrefix: user.apiKeyPrefix },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async regenerateApiKey(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(`API key regeneration failed: user not found (${userId})`);
      throw new UnauthorizedException('User not found');
    }

    const plainApiKey = this.generateApiKeyPlain();
    const apiKeyHash = await this.hashService.hash(plainApiKey);
    const apiKeyPrefix = plainApiKey.substring(0, 12) + '...';

    await this.userRepository.updateApiKey(userId, apiKeyHash, apiKeyPrefix);

    this.logger.log(`API key regenerated successfully for user: userId=${userId}`);

    return {
      apiKey: plainApiKey, // Shown only once
      apiKeyPrefix,
    };
  }

  async refreshTokens(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
    } catch (e) {
      this.logger.warn(`Token refresh failed: token verification failed (${e.message})`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(`Token refresh failed: user not found in database for userId=${userId}`);
      throw new UnauthorizedException('Access Denied');
    }

    const savedHash = await this.refreshTokenRepository.findHash(userId);
    if (!savedHash) {
      this.logger.warn(`Token refresh failed: session expired or revoked in Redis for userId=${userId}`);
      throw new UnauthorizedException('Access Denied');
    }

    const isRefreshTokenValid = await this.hashService.compare(refreshToken, savedHash);
    if (!isRefreshTokenValid) {
      this.logger.warn(`Token refresh failed: token signature mismatch (possible reuse attempt) for userId=${userId}`);
      throw new UnauthorizedException('Access Denied');
    }

    this.logger.log(`Tokens rotated successfully for user: userId=${userId}`);
    return this.getTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.revoke(userId);
    this.logger.log(`User logged out, refresh token revoked: userId=${userId}`);
  }

  async validateUserByJwt(payload: any) {
    return this.userRepository.findById(payload.sub);
  }
}
