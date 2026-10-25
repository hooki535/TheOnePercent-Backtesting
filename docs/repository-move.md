# Repository split

The replay UI, drawing suite, bundled examples and regression tests live here. The original
website's navigation no longer includes Backtesting. Old static and Flask replay addresses
are compatibility redirects which preserve the hash containing the session ID.

The shared Supabase accounts, private archive and daily updater have not moved or been
reset. This avoids duplicating user records, changing source publication permissions, or
breaking the existing signed update pipeline. See the root README for operational details.
