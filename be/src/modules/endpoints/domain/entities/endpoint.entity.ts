export class Endpoint {
  id: string;
  userId: string;
  name: string;
  incomingKey: string;
  destinationUrl: string;
  provider: string | null;
  signingSecret: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<Endpoint>) {
    Object.assign(this, partial);
  }
}
