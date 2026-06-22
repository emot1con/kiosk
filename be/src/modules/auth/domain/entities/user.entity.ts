// Domain Entity — Plain TypeScript class, NO ORM decorators
// Represents a registered user in the Kiosk system

export class User {
  id: string;
  email: string;
  passwordHash: string;
  apiKeyHash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
