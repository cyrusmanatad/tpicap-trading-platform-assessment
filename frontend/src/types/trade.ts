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

export type TradeHistoryAction = 'CREATED' | 'UPDATED' | 'CANCELLED';

export type TradeFieldChange = {
  from: string | number | null;
  to: string | number | null;
};

export type TradeHistoryEntry = {
  id: number;
  tradeId: number;
  action: TradeHistoryAction;
  actorUserId: string;
  actorEmail: string;
  actorName: string;
  changes: Record<string, TradeFieldChange>;
  createdAt: string;
};
