import { api } from './index';
import type { Trade } from '../types/trade';

export async function getTrades(): Promise<Trade[]> {
  const { data } = await api.get<Trade[]>('/trades');
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
