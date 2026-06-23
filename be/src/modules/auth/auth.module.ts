import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserOrmEntity } from './infrastructure/adapters/user.orm-entity';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AuthService } from './application/auth.service';
import { PostgresUserRepository } from './infrastructure/adapters/postgres-user.repository';
import { BcryptHashService } from './infrastructure/adapters/bcrypt-hash.service';
import { USER_REPOSITORY } from './domain/ports/user-repository.port';
import { HASH_SERVICE } from './domain/ports/hash-service.port';
import { REFRESH_TOKEN_REPOSITORY } from './domain/ports/refresh-token-repository.port';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { RedisRefreshTokenRepository } from './infrastructure/adapters/redis-refresh-token.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRATION') || '7d') as any },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: PostgresUserRepository,
    },
    {
      provide: HASH_SERVICE,
      useClass: BcryptHashService,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RedisRefreshTokenRepository,
    },
  ],
  exports: [
    USER_REPOSITORY, // Export if other modules need it
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}
