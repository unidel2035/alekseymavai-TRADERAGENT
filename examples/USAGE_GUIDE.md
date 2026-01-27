# Fibonacci Tower - Usage Guide

## Quick Start

### Step 1: Add the Indicator to TradingView

1. Open [TradingView](https://www.tradingview.com/)
2. Click on "Pine Editor" at the bottom of the screen
3. Click "New" → "Blank indicator"
4. Copy the entire code from `indicators/fibonacci_tower.pine`
5. Paste it into the editor
6. Click "Save" and give it a name (e.g., "Fibonacci Tower")
7. Click "Add to Chart"

### Step 2: Configure the Indicator

The indicator comes with sensible defaults, but you can customize it:

1. Click the gear icon next to "Fibonacci Tower" in the indicator list
2. Adjust parameters based on your trading style:
   - **Shorter timeframes (1m-15m)**: Consider RSI length of 9-11, MACD (9, 19, 6)
   - **Standard timeframes (1h-4h)**: Default settings work well
   - **Longer timeframes (1D+)**: Consider RSI length of 21, MACD (19, 39, 9)

### Step 3: Interpret Signals

#### Buy Signal Appearance
When all conditions align, you'll see:
- 📐 Green triangle pointing up below the candle
- "BUY" text label
- Light green background highlight
- Fibonacci levels drawn extending to the right

#### What Each Component Means

**Three Bearish Candles** (Red/Down Candles):
- Shows sellers have been in control
- Momentum may be exhausted
- Potential capitulation point

**RSI Below 30**:
- Asset is oversold
- Price may have fallen too far, too fast
- Reversal probability increases

**MACD Bullish Cross**:
- Momentum is shifting from negative to positive
- Buyers are starting to overpower sellers
- Confirmation of potential reversal

## Trading Strategies

### Strategy 1: Conservative Entry

**Entry**: Wait for a buy signal AND price to close above the 23.6% Fibonacci level

**Stop Loss**: Below the 0% Fibonacci level (or below the signal candle low)

**Take Profit**:
- TP1: 38.2% level (take 30% profit)
- TP2: 61.8% level (take 40% profit)
- TP3: Let the rest run with trailing stop

**Risk/Reward**: Typically 1:2 or better

### Strategy 2: Aggressive Entry

**Entry**: Immediately on buy signal

**Stop Loss**: 2-3% below entry or below the third bearish candle

**Take Profit**:
- TP1: 23.6% level (quick profit)
- TP2: 50% level
- TP3: 100% level (swing high)

**Risk/Reward**: Aim for 1:3

### Strategy 3: Scalping (Short Timeframes)

**Entry**: Buy signal on 5m or 15m chart

**Stop Loss**: Tight, below signal candle (1-2%)

**Take Profit**: First Fibonacci level hit (usually 23.6% or 38.2%)

**Exit**: Close position within 1-4 hours

## Multi-Timeframe Analysis

For higher probability trades, confirm signals across timeframes:

1. **Identify trend** on 4H or 1D chart
2. **Look for buy signal** on 1H chart in the direction of the higher timeframe trend
3. **Time entry** using 15m chart signal for better entry price

### Example:
- Daily chart: Uptrend
- 4H chart: Pullback (healthy correction)
- 1H chart: ✅ Fibonacci Tower buy signal appears
- Action: Enter long with confidence

## Risk Management Rules

### Position Sizing
- Never risk more than 1-2% of your account per trade
- Calculate position size: `Position Size = (Account Risk $) / (Entry - Stop Loss)`

### Stop Loss Placement
1. **Below structure**: Under the 0% Fibonacci level
2. **Fixed percentage**: 2-5% below entry
3. **ATR-based**: 1.5-2x ATR below entry

### When to Avoid Signals

❌ **Don't trade signals when**:
- Major news events are scheduled within 1 hour
- Price is in a strong downtrend on higher timeframes
- Volume is extremely low (illiquid conditions)
- Near major support/resistance from higher timeframes
- Multiple signals appear in quick succession (choppy market)

## Real-World Example

### BTC/USD - 1H Chart Scenario

**Setup**:
- Price: $42,000
- Three red candles push price down from $43,500
- RSI drops to 28
- MACD histogram crosses to positive

**Signal Triggers**:
- ✅ Three bearish candles: confirmed
- ✅ RSI < 30: confirmed (28)
- ✅ MACD bullish cross: confirmed
- → **BUY SIGNAL** appears at $42,000

**Fibonacci Levels Drawn**:
- 0%: $41,800 (swing low from last 100 bars)
- 23.6%: $42,850
- 38.2%: $43,500
- 50%: $44,150
- 61.8%: $44,800
- 78.6%: $45,450
- 100%: $46,250 (swing high)

**Trade Execution**:
- Entry: $42,100 (next candle open)
- Stop: $41,700 (below 0% level)
- TP1: $42,850 (23.6% - close 30%)
- TP2: $44,800 (61.8% - close 50%)
- TP3: Trail remaining 20%

**Result**: TP1 hit in 3 hours (+1.78%), TP2 hit in 12 hours (+6.4%)

## Advanced Tips

### 1. Combine with Volume
Look for buy signals where volume is increasing on the signal candle. This confirms buying pressure.

### 2. Watch the 61.8% Level
The "Golden Ratio" is the most important Fibonacci level. If price struggles here, it may reverse back down.

### 3. Multiple Signals
If you get several buy signals close together, it indicates strong buying interest. The Fibonacci levels from the first signal often remain relevant.

### 4. Trend Filter
Add a 200 EMA to your chart. Only take buy signals when price is above the 200 EMA for higher probability trades.

### 5. Use Alerts
Set up alerts so you don't have to watch charts constantly:
- Right-click chart → Add Alert
- Condition: "Fibonacci Tower Buy Signal"
- Get notified on phone/email when signals appear

## Backtesting Your Settings

Before trading with real money:

1. Apply indicator to historical chart data
2. Scroll back 6-12 months
3. Note each buy signal and where price went
4. Track hypothetical results in a journal
5. Calculate win rate and average R:R
6. Adjust parameters if needed
7. Paper trade for 2-4 weeks

## Common Mistakes to Avoid

1. **Ignoring higher timeframe trend**: Don't buy in a strong downtrend
2. **No stop loss**: Always protect your capital
3. **Overtrading**: Not every signal is worth taking
4. **Ignoring Fibonacci levels**: These are your roadmap for the trade
5. **Moving stop loss closer**: This increases your loss rate
6. **Taking profits too early**: Let winners run to Fibonacci targets

## Optimal Timeframes per Asset

| Asset Type | Recommended Timeframe | Holding Period |
|------------|----------------------|----------------|
| BTC, ETH | 1H, 4H | 1-7 days |
| Altcoins | 15m, 1H | 4 hours - 2 days |
| Forex | 4H, 1D | 1-5 days |
| Stocks | 1D, 1W | 1-8 weeks |
| Futures | 15m, 1H | Intraday - 3 days |

## Troubleshooting

### "No signals appearing"
- Check that all three conditions are enabled
- Try longer lookback period for Fibonacci
- Adjust RSI oversold level (try 35-40)
- Market may be in strong trend (less reversals)

### "Too many false signals"
- Add volume filter
- Only trade with higher timeframe trend
- Increase RSI oversold threshold
- Require 4-5 bearish candles instead of 3

### "Fibonacci levels seem wrong"
- Increase lookback period (try 150-200)
- Ensure chart has enough historical data loaded
- Check that you're on a clean price chart (no other overlays interfering)

## Resources for Further Learning

- [Pine Script v5 User Manual](https://www.tradingview.com/pine-script-docs/en/v5/)
- [Fibonacci Trading Strategies](https://www.investopedia.com/articles/technical/04/033104.asp)
- [RSI Trading Guide](https://www.investopedia.com/terms/r/rsi.asp)
- [MACD Indicator Explained](https://www.investopedia.com/terms/m/macd.asp)

## Support

For issues, questions, or contributions:
- Open an issue on the GitHub repository
- Review the `indicators/README.md` for technical details

---

**Disclaimer**: This indicator is for educational purposes. Past performance does not guarantee future results. Always practice proper risk management and never invest more than you can afford to lose.
