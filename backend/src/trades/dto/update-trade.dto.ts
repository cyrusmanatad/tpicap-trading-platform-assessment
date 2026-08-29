import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { TradeSide, TradeStatus } from '../trade.entity.js';

export class UpdateTradeDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(['BUY', 'SELL'])
  side?: TradeSide;

  @IsOptional()
  @IsString()
  trader?: string;

  @IsOptional()
  @IsString()
  book?: string;

  @IsOptional()
  @IsString()
  counterparty?: string;

  @IsOptional()
  @IsDateString()
  tradeDate?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'CANCELLED'])
  status?: TradeStatus;
}