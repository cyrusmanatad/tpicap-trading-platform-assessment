export type TradeStatus = 'ACTIVE' | 'CANCELLED';
export type TradeSide = 'BUY' | 'SELL';
export type Tone = 'buy' | 'sell' | 'amber';

export interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  side: TradeSide;
  trader: string;
  book: string;
  counterparty: string;
  tradeDate: string;
  status: TradeStatus;
}
