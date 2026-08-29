import { Column, CreateDateColumn, Entity, Generated, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TradeSide = 'BUY' | 'SELL';
export type TradeStatus = 'ACTIVE' | 'CANCELLED';

@Entity({ name: 'trades' })
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, nullable: false })
  @Generated('uuid')
  trade_uuid: string;

  @Column()
  symbol: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'enum', enum: ['BUY', 'SELL'] })
  side: TradeSide;

  @Column()
  trader: string;

  @Column()
  book: string;

  @Column()
  counterparty: string;

  @Column({ type: 'timestamptz' })
  tradeDate: Date;

  @Column({ type: 'enum', enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' })
  status: TradeStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
