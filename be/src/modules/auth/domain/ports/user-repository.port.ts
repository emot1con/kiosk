import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByApiKeyHash(hash: string): Promise<User | null>;
  create(data: Partial<User>): Promise<User>;
  updateApiKey(userId: string, newHash: string, newPrefix: string): Promise<void>;
  softDelete(userId: string): Promise<void>;
}
