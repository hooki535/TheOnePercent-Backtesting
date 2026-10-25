# TheOnePercent Backtesting

Standalone historical replay, simulated trading, drawing tools, strategies and analytics.

- Website: https://hooki535.github.io/TheOnePercent-Backtesting/
- Original website: https://hooki535.github.io/TheOnePercent/
- Extracted from `hooki535/TheOnePercent` commit `e300a8a24d857323632edb4107b3f6e34dc9dbc7`.

## Run locally

Run `python -m http.server 8080` here, then open http://localhost:8080/.
No build step or private credentials are required. GitHub Pages serves the main branch root.
Run `node --test tests/*.test.cjs` to validate.

## Existing accounts and saved work

Sign in with your existing TheOnePercent account. This app retains the same Supabase
project, account IDs, workspace keys and optimistic revision checks. No user rows were
deleted or copied. Both GitHub Pages applications share the `hooki535.github.io` origin,
so existing local sessions and guest backups remain readable in the same browser/profile.
OAuth sign-in and reset emails use the existing authorized TheOnePercent callback pages;
OAuth returns through the old replay URL to this app. Password sign-in stays here.
Other devices use account sync or the workspace backup/restore controls.

## Historical data and daily updates

The private H1/D1 archive stays in the existing Supabase database. Account grants and
source restrictions remain in force. M1 sample files and their attribution are bundled.
The existing daily job in `hooki535/TheOnePercent/.github/workflows/history-refresh.yml`
continues at 03:20 UTC and feeds this app directly through the same history RPCs.
Its signed OIDC identity is deliberately unchanged; this repository does not schedule
a duplicate uploader. The database schemas, uploader, scheduled workflow and server functions stay in the original repository. No database/service keys belong in frontend files or this repository.

## Chart library

Uses Lightweight Charts with the included vendor license and our own drawing/replay code.
This repository does not contain the separately licensed TradingView Advanced Charts library.
