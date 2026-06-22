import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IUserRepository } from '../domain/ports/user-repository.port';
import { USER_REPOSITORY } from '../domain/ports/user-repository.port';
import type { IHashService } from '../domain/ports/hash-service.port';
import { HASH_SERVICE } from '../domain/ports/hash-service.port';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    private readonly jwtService: JwtService,
  ) {}

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

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
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

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
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

  async validateUserByJwt(payload: any) {
    return this.userRepository.findById(payload.sub);
  }
}
