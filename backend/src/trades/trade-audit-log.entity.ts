import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { FieldChange, TradeAuditAction } from './trade-audit.js';
import { Trade } from './trade.entity.js';

@Entity({ name: 'trade_audit_logs' })
export class TradeAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tradeId: number;

  @ManyToOne(() => Trade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column({ type: 'enum', enum: ['CREATED', 'UPDATED', 'CANCELLED'] })
  action: TradeAuditAction;

  @Column({ type: 'uuid' })
  actorUserId: string;

  @Column()
  actorEmail: string;

  @Column()
  actorName: string;

  @Column({ type: 'jsonb' })
  changes: Record<string, FieldChange>;

  @CreateDateColumn()
  createdAt: Date;
}
