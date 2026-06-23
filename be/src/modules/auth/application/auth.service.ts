import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
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
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async getTokens(userId: string, email: string) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION') || '7d';
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
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashService.hash(passwordPlain);
    const plainApiKey = this.generateApiKeyPlain();
    const apiKeyHash = await this.hashService.hash(plainApiKey);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      apiKeyHash,
    });

    const tokens = await this.getTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      apiKey: plainApiKey, // Shown only once upon registration
    };
  }

  async login(email: string, passwordPlain: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashService.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async regenerateApiKey(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const plainApiKey = this.generateApiKeyPlain();
    const apiKeyHash = await this.hashService.hash(plainApiKey);

    await this.userRepository.updateApiKeyHash(userId, apiKeyHash);

    return {
      apiKey: plainApiKey, // Shown only once
    };
  }

  async refreshTokens(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    const savedHash = await this.refreshTokenRepository.findHash(userId);
    if (!savedHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isRefreshTokenValid = await this.hashService.compare(refreshToken, savedHash);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.getTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.revoke(userId);
  }

  async validateUserByJwt(payload: any) {
    return this.userRepository.findById(payload.sub);
  }
}
