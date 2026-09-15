import type { Trade } from '../types/trade';
import { getTradeDirection } from '../utils/trade-utils';

interface TickerTapeProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function TickerTape({ trades, isLoading = false }: TickerTapeProps) {
  const tickerItems = [...trades]
    .slice(0, 10)
    .map((trade) => {
      const price = Number(trade.price ?? 0);
      return `${trade.symbol} ${price.toFixed(2)} ${getTradeDirection(trade.side)}`;
    });

  if (tickerItems.length === 0) {
    const message = isLoading ? 'SYNCING TRADE FEED...' : 'NO RECENT TRADES ON TAPE';
    return (
      <div className="ticker-wrap" aria-label="Ticker tape">
        <div className="ticker-track ticker-track-static">
          <span className="ticker-item mono">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-wrap" aria-label="Ticker tape">
      <div className="ticker-track">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span key={`${item}-${index}`} className="ticker-item mono">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
