import type { Trade } from '../types/trade';
import { getTradeDirection } from '../utils/trade-utils';

interface TickerTapeProps {
  trades: Trade[];
}

export function TickerTape({ trades }: TickerTapeProps) {
  const tickerItems = [...trades]
    .slice(0, 10)
    .map((trade) => {
      const price = Number(trade.price ?? 0);
      return `${trade.symbol} ${price.toFixed(2)} ${getTradeDirection(trade.side)}`;
    });

  if (tickerItems.length === 0) {
    return (
      <div className="ticker-wrap" aria-label="Ticker tape">
        <div className="ticker-track">
          <span className="ticker-item mono">LOADING MARKET DATA...</span>
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
