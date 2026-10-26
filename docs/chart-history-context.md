# Earlier chart history

New cloud sessions request up to 2,400 hourly candles, 120 daily candles, or
1,440 minute candles before the selected start. A saved session still contains
at most 5,000 source candles. Coverage near the beginning of an archive may be shorter.
The selected replay start remains the same; no prices are interpolated.

Existing cloud sessions automatically request earlier history when the selected
chart timeframe has fewer than 30 visible historical candles. The **Load earlier
candles** action can also request it explicitly. The reader verifies the account's
existing archive permissions, immutable chunk checksum, ordering, instrument and OHLC.
Only timestamps before the saved dataset's first candle enter this display context.

Earlier display context is kept in memory, separately for each portfolio market.
It does not alter the source candles, execution cursor, actions, drawings, trades,
balance, or saved workspace. It is fetched again when needed after a reload.
Unavailable data leaves the session intact and exposes a retry action.

Higher timeframes aggregate the earlier context plus the already revealed source
candles. Future candles remain hidden. Drawing coordinates still use the original
source indexes. Sparse charts keep the requested visible range instead of stretching
a few candles across the chart.

This does not create minute history from hourly candles, extend the forward replay
window, or add TradingView Advanced Charts. Smaller timeframes need a finer source
dataset. Included samples and local CSV sessions continue to use their stored history.

Verification covers historical loading, future-price isolation, drawing coordinates,
unchanged execution snapshots, portfolio isolation, desktop/mobile layouts, reloads,
and retrying an unavailable history request.
