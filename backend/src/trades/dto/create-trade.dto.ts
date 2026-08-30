import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { TradeSide, TradeStatus } from '../trade.entity.js';

export class CreateTradeDto {
  @IsOptional()
  @IsUUID()
  trade_uuid?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  symbol: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  price: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(['BUY', 'SELL'])
  side: TradeSide;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  trader: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  book: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  counterparty: string;

  @IsDateString()
  tradeDate: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsEnum(['ACTIVE', 'CANCELLED'])
  status?: TradeStatus;
}
