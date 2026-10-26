# Research Lab update

This update improves the existing backtesting app. Its repository, routes, account
IDs, storage keys, historical-data connection and execution engine remain in place.
It does not create a second website or import the prototype's local database.

## Research translated into working features

The supplied MyTradingJourney visual proposal (Research Lab, Analytics & Reviews,
and Mobile experience) and HTML prototype guide the blue-and-gold research workspace,
session preparation, visible execution assumptions, and reflection workflow.

- Research totals follow the active search, instrument, date and session filters.
- The session brief records a hypothesis, entry conditions, invalidation, risk-plan
  notes, observations and one next improvement.
- The replay workspace displays each pair's real source, base interval, fees,
  slippage and currency-conversion model, plus the engine's same-candle rules.
- Trade reviews retain existing notes and emotion, with optional setup, execution,
  lesson and rule-adherence fields.
- Briefs and reviews use the existing account sync and JSON workspace backups.
  Restoring a previous backup does not invent a research brief.
- A restarted attempt retains the preparation and clears the previous reflection.

Risk plans are notes: they do not change costs, fills, order size or enforced challenge
limits. Preparation progress requires a hypothesis, entry plan and risk plan. A reviewed
trade has an actual reflection or rule evaluation; unrelated review rows and empty
submissions do not inflate the count. Workspace totals are derived from saved sessions.

The prototype's manual P/L entry, synthetic demo generator, local-only replay, external
inspiration images, books, document vault and other studio areas are not imported.

## Verification

Regression checks cover single and multi-pair snapshot restoration, unchanged fills,
P/L and cursor, legacy backups, bounded metadata, research-aware account sync,
cross-account isolation, filtered dashboard counts, escaped notes, and browser
preparation/review workflows on desktop and mobile. History-context and retry checks
continue to run against the same replay workspace.
