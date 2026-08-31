import { useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getTrades, getTradeSummary, updateTrade as updateTradeApi, type TradeQueryParams, type TradeSummary } from '../api/tradeApi';
import type { Tone, Trade, TradeStatus } from '../types/trade';
import { emptyDraft, normalizeTrade } from '../utils/trade-utils';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [simulateFeed, setSimulateFeed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('en-US'));
  const [flashTradeId, setFlashTradeId] = useState<string | null>(null);
  const [flashTone, setFlashTone] = useState<Tone | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [pageMeta, setPageMeta] = useState({ total: 0, limit: 10, offset: 0 });
  const [summary, setSummary] = useState<TradeSummary>({
    total: 0,
    notional: 0,
    active: 0,
    cancelled: 0,
    buyVolume: 0,
    sellVolume: 0,
  });

  const fetchTrades = useCallback(async (params: TradeQueryParams = {}) => {
    try {
      const [page, summaryData] = await Promise.all([
        getTrades(params),
        getTradeSummary(params),
      ]);
      if (page && Array.isArray(page.items)) {
        setTrades(page.items.map((trade) => normalizeTrade(trade)));
        setPageMeta({ total: page.total ?? 0, limit: page.limit ?? 10, offset: page.offset ?? 0 });
      }
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch {
      // backend is the source of truth; state remains as-is until the API responds
    }
  }, []);

  const triggerFlash = (tradeId: string, tone: Tone) => {
    setFlashTradeId(tradeId);
    setFlashTone(tone);
    window.clearTimeout((triggerFlash as unknown as { timeoutId?: number }).timeoutId);
    (triggerFlash as unknown as { timeoutId?: number }).timeoutId = window.setTimeout(() => {
      setFlashTradeId(null);
      setFlashTone(null);
    }, 1100);
  };

  useEffect(() => {
    void fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    const socket: Socket = io(undefined, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    setIsSocketConnected(socket.connected);

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('reconnect', () => {
      setIsSocketConnected(true);
    });

    socket.on('feed-status', (status: { connected?: boolean }) => {
      if (typeof status?.connected === 'boolean') {
        setIsSocketConnected(status.connected);
      }
    });

    socket.on('trade-created', (trade: Trade) => {
      const normalizedTrade = normalizeTrade(trade);
      setTrades((current) => [normalizedTrade, ...current]);
      triggerFlash(normalizedTrade.id, normalizedTrade.side === 'BUY' ? 'buy' : 'sell');
    });

    socket.on('trade-updated', (trade: Trade) => {
      const normalizedTrade = normalizeTrade(trade);
      setTrades((current) => current.map((item) => (item.id === normalizedTrade.id ? normalizedTrade : item)));
      triggerFlash(normalizedTrade.id, 'amber');
    });

    socket.on('trade-cancelled', (trade: Trade) => {
      const normalizedTrade = normalizeTrade(trade);
      setTrades((current) =>
        current.map((item) => (item.id === normalizedTrade.id ? { ...item, status: 'CANCELLED' as TradeStatus } : item)),
      );
      triggerFlash(normalizedTrade.id, 'sell');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!simulateFeed) {
      return;
    }

    const interval = window.setInterval(() => {
      setTrades((current) => {
        const activeTrades = current.filter((trade) => trade.status === 'ACTIVE');
        if (activeTrades.length === 0) {
          return current;
        }

        const randIndex = Math.floor(Math.random() * activeTrades.length);
        const trade = activeTrades[randIndex];
        const currentPrice = Number(trade.price ?? 0);
        const change = (Math.random() - 0.5) * currentPrice * 0.02;
        const nextPrice = Math.max(0.01, Number((currentPrice + change).toFixed(2)));
        const nextTrade = { ...trade, price: nextPrice };
        setLastUpdated(new Date().toLocaleTimeString('en-US'));
        triggerFlash(nextTrade.id, nextTrade.price >= trade.price ? 'buy' : 'sell');
        return current.map((item) => (item.id === trade.id ? nextTrade : item));
      });
    }, 2800);

    return () => window.clearInterval(interval);
  }, [simulateFeed]);

  const updateTrade = async (trade: Trade) => {
    const payload = {
      symbol: trade.symbol,
      quantity: Number(trade.quantity),
      price: Number(trade.price),
      side: trade.side,
      trader: trade.trader,
      book: trade.book,
      counterparty: trade.counterparty,
      tradeDate: trade.tradeDate,
      status: trade.status,
    };

    const updatedTrade = await updateTradeApi(trade.id, payload);

    setTrades((current) =>
      current.map((item) => (item.id === updatedTrade.id ? updatedTrade : item)),
    );

    triggerFlash(updatedTrade.id, 'amber');
    return updatedTrade;
  };



  return {
    trades,
    setTrades,
    summary,
    simulateFeed,
    setSimulateFeed,
    lastUpdated,
    flashTradeId,
    flashTone,
    isSocketConnected,
    triggerFlash,
    emptyDraft,
    updateTrade,
    fetchTrades,
    pageMeta,
  };
}
