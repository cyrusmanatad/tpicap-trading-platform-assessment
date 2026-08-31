import { api } from './index';
import type { Trade, TradeSide, TradeStatus } from '../types/trade';

export type TradeQueryParams = {
  search?: string;
  side?: TradeSide | 'ALL';
  status?: TradeStatus | 'ALL';
  sort?: 'timestamp' | 'symbol' | 'notional';
  limit?: number;
  offset?: number;
};

export type TradePage = {
  items: Trade[];
  total: number;
  limit: number;
  offset: number;
};

export type TradeSummary = {
  total: number;
  notional: number;
  active: number;
  cancelled: number;
  buyVolume: number;
  sellVolume: number;
};

export async function getTrades(params: TradeQueryParams = {}): Promise<TradePage> {
  const { data } = await api.get<TradePage>('/trades', {
    params: {
      ...params,
      side: params.side === 'ALL' ? undefined : params.side,
      status: params.status === 'ALL' ? undefined : params.status,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
    },
  });
  return data;
}

export async function getTradeSummary(params: TradeQueryParams = {}): Promise<TradeSummary> {
  const { data } = await api.get<TradeSummary>('/trades/summary', {
    params: {
      search: params.search,
      side: params.side === 'ALL' ? undefined : params.side,
      status: params.status === 'ALL' ? undefined : params.status,
    },
  });
  return data;
}

export async function createTrade(payload: Partial<Trade>): Promise<Trade> {
  const { data } = await api.post<Trade>('/trades', payload);
  return data;
}

export async function updateTrade(id: string, payload: Partial<Trade>): Promise<Trade> {
  const { data } = await api.put<Trade>(`/trades/${id}`, payload);
  return data;
}

export async function cancelTrade(id: string): Promise<Trade> {
  const { data } = await api.patch<Trade>(`/trades/${id}/cancel`);
  return data;
}
