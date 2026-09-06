import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

describe('Trade DTO validation', () => {
  it('accepts numeric strings and trims values for create payloads', () => {
    const dto = plainToInstance(CreateTradeDto, {
      symbol: '  aapl  ',
      quantity: '5',
      price: '123.45',
      side: 'BUY',
      trader: '  alice  ',
      book: '  EQ-NA  ',
      counterparty: 'Goldman Sachs',
      tradeDate: '2026-08-30T10:00:00.000Z',
    });

    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
    expect(dto.symbol).toBe('AAPL');
    expect(dto.quantity).toBe(5);
    expect(dto.price).toBe(123.45);
    expect(dto.trader).toBe('ALICE');
    expect(dto.book).toBe('EQ-NA');
  });

  it('rejects invalid update payloads', () => {
    const dto = Object.assign(new UpdateTradeDto(), {
      quantity: 0,
      price: -1,
      side: 'HOLD',
    });

    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
