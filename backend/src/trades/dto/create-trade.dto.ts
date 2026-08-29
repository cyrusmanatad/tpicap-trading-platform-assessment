import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import type { TradeSide, TradeStatus } from '../trade.entity.js';

export class CreateTradeDto {
  @IsOptional()
  @IsUUID()
  trade_uuid?: string;

  @IsString()
  symbol: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(['BUY', 'SELL'])
  side: TradeSide;

  @IsString()
  trader: string;

  @IsString()
  book: string;

  @IsString()
  counterparty: string;

  @IsDateString()
  tradeDate: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'CANCELLED'])
  status?: TradeStatus;
}
