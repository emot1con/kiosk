import { Endpoint } from '../entities/endpoint.entity';

export const ENDPOINT_REPOSITORY = Symbol('ENDPOINT_REPOSITORY');

export interface IEndpointRepository {
  findById(id: string): Promise<Endpoint | null>;
  findAll(): Promise<Endpoint[]>;
  findByIncomingKey(key: string): Promise<Endpoint | null>;
  create(data: Partial<Endpoint>): Promise<Endpoint>;
  update(id: string, data: Partial<Endpoint>): Promise<Endpoint>;
  toggleActive(id: string, isActive: boolean): Promise<void>;
  softDelete(id: string): Promise<void>;
}
