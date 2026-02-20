# ZenMoney Skill

Script-based CLI skill for [OpenClaw](https://openclaw.com) — personal finance management through ZenMoney API.

23 tools for accounts, transactions, budgets, reminders, analytics, and ML suggestions.

## How it works

OpenClaw agent reads `skill/SKILL.md` and calls the CLI via `exec`:

```bash
python3 scripts/cli.py --list
python3 scripts/cli.py --describe get_transactions
python3 scripts/cli.py --call '{"tool":"get_accounts","arguments":{}}'
python3 scripts/cli.py --call '{"tool":"get_analytics","arguments":{"start_date":"2026-02-01","type":"expense","group_by":"category"}}'
```

## Tools (23)

**Read:**
- `get_accounts` — list accounts with balances
- `get_transactions` — query by date, account, category, type (with pagination)
- `get_categories` — category tree
- `get_instruments` — currencies and rates
- `get_budgets` — monthly budget limits
- `analyze_budget_detailed` — detailed budget analysis with two modes (balance vs expense, income vs expense)
- `get_reminders` — scheduled payments and markers (with pagination)
- `get_analytics` — spending/income aggregations
- `suggest` — ML category/merchant suggestions
- `get_merchants` — merchant search (with pagination)
- `check_auth_status` — verify token validity

**Write:**
- `create_transaction`, `update_transaction`, `delete_transaction`
- `create_account`
- `setup_budget_mode` — configure budget analysis mode
- `create_budget`, `update_budget`, `delete_budget`
- `create_reminder`, `update_reminder`, `delete_reminder`
- `create_reminder_marker`, `delete_reminder_marker`

## Setup

### Requirements

- Python 3.8+
- No pip dependencies (uses only stdlib `urllib`)

### Configuration

Create `config.json` in project root:

```json
{
  "token": "your-zenmoney-access-token",
  "billing_period_start_day": 20,
  "budget_mode": "balance_vs_expense",
  "round_balance_to_integer": true
}
```

Or set environment variable `ZENMONEY_TOKEN`.

**Configuration Options:**
- `token` — ZenMoney API access token (required)
- `billing_period_start_day` — Day of month when your billing period starts (optional)
- `budget_mode` — Budget analysis mode: `balance_vs_expense` or `income_vs_expense` (optional)
- `round_balance_to_integer` — Round balance to nearest integer in ruble (optional)

### Getting a token

- From [zerro.app](https://zerro.app) — authorize with ZenMoney, extract token from browser storage
- From [budgera.com/settings/export](https://budgera.com/settings/export) — copy API token

## Budget Analysis Modes

The `analyze_budget_detailed` tool supports two budget analysis modes:

**Balance vs Expense** (`balance_vs_expense`)
- Analyzes budget by comparing account balances with spending
- Includes all money movements, including transfers between accounts
- Useful for understanding true cash position and budget impact
- Shows how budgets affect overall balance

**Income vs Expense** (`income_vs_expense`)
- Analyzes budget by comparing income with spending only
- Excludes account transfers and internal movements
- Focuses on actual money earned vs spent
- Useful for understanding spending patterns relative to income

Switch between modes using `setup_budget_mode` tool or configure in `config.json` with `budget_mode` parameter.

## Architecture

- `scripts/cli.py` — standalone CLI, 23 tools, file-based cache (`.cache.json`)
- `skill/SKILL.md` — skill definition with tool reference and routing table
- `skill/PROFILE.example.md` — user profile template for financial planning context

### Sync protocol

ZenMoney uses diff-based sync via `POST /v8/diff/`. The CLI maintains `.cache.json` with `serverTimestamp` for incremental sync between invocations.

## License

MIT
