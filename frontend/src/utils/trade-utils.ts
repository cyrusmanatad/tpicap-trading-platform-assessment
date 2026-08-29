import type { Trade, TradeSide, TradeStatus } from '../types/trade';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export const formatMetric = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);

export const normalizeTrade = (trade: Partial<Trade>): Trade => ({
  id: String(trade.id ?? 'TRD-0000'),
  symbol: String(trade.symbol ?? ''),
  quantity: Number(trade.quantity ?? 0),
  price: Number(trade.price ?? 0),
  side: trade.side === 'SELL' ? 'SELL' : 'BUY',
  trader: String(trade.trader ?? 'Unassigned'),
  book: String(trade.book ?? 'EQ-NA'),
  counterparty: String(trade.counterparty ?? 'Unknown'),
  tradeDate: String(trade.tradeDate ?? new Date().toISOString()),
  status: trade.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE',
});

export const emptyDraft: Partial<Trade> = {
  symbol: '',
  quantity: 100,
  price: 0,
  side: 'BUY' as TradeSide,
  trader: '',
  book: 'EQ-NA',
  counterparty: '',
  tradeDate: new Date().toISOString(),
  status: 'ACTIVE' as TradeStatus,
};

export const getTradeDirection = (side: TradeSide) => (side === 'BUY' ? '▲' : '▼');
