import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('delivery_attempts')
export class AttemptOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ name: 'latency_ms', type: 'int', default: 0 })
  latencyMs: number;

  @CreateDateColumn({ name: 'attempted_at', type: 'timestamptz' })
  attemptedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
