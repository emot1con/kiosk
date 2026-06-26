import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('endpoints')
export class EndpointOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'incoming_key', type: 'varchar', length: 32, unique: true })
  incomingKey: string;

  @Column({ name: 'destination_url', type: 'text' })
  destinationUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string | null;

  @Column({ name: 'signing_secret', type: 'varchar', length: 255, nullable: true })
  signingSecret: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
