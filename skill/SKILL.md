---
name: zenmoney
description: "Token-efficient personal finance management through ZenMoney API via executor. Use when the user needs to: (1) Analyze spending and income (expenses by category, monthly budgets, financial analytics), (2) Create or modify transactions (add expenses, record income, transfers between accounts), (3) View account balances and financial data, (4) Plan budget or check financial capacity for purchases, (5) Work with reminders and scheduled payments, (6) Get ML-powered category suggestions for transactions. Triggers include questions about money, spending, budgets, accounts, or any financial management tasks in Russian or English. Context-efficient: ~100 tokens idle vs ~10k for direct MCP."
---

# ZenMoney Personal Finance Assistant (Executor Mode)

All tools invoked via executor.py through bash.

## Invocation Pattern

```bash
# All tool calls use this pattern:
python ~/.claude/skills/zenmoney/executor.py --call '{"tool": "TOOL_NAME", "arguments": {...}}'

# List tools / get schema:
python ~/.claude/skills/zenmoney/executor.py --list
python ~/.claude/skills/zenmoney/executor.py --describe TOOL_NAME
```

Always use absolute path to executor.py.

## Tool Reference (22 tools)

**Read:**
- `get_accounts` — `include_archived`
- `get_transactions` — `start_date`(req), `end_date`, `account_id`, `category_id`, `type`, `limit`(max 500)
- `get_categories` — no args
- `get_instruments` — no args
- `get_budgets` — `month`(req, yyyy-MM)
- `get_reminders` — `include_processed`
- `get_analytics` — `start_date`(req), `end_date`, `group_by`(category/account/merchant), `type`(expense/income/all)
- `suggest` — `payee`(req)

**Write:**
- `create_transaction` — `type`(req: expense/income/transfer), `amount`(req), `account_id`(req), `to_account_id`, `category_ids`, `date`, `payee`, `comment`
- `update_transaction` — `id`(req), any field
- `delete_transaction` — `id`(req)
- `create_account` — `title`, `type`, `currency_id`(req), `balance`, `credit_limit`
- `create_reminder` — `type`, `amount`, `account_id`, `interval`(req: day/week/month/year/null), `points`, `start_date`, `end_date`, `payee`, `comment`
- `update_reminder` / `delete_reminder` — `id`(req)
- `create_reminder_marker` — `type`, `amount`, `account_id`, `date`(req), `payee`; auto-creates Reminder if no `reminder_id`
- `delete_reminder_marker` — `id`(req)
- `create_budget` — `month`, `category`(req), `income`, `outcome`, `income_lock`, `outcome_lock`
- `update_budget` / `delete_budget` — `month`, `category`(req)

**System:**
- `check_auth_status` — no args

## Workflows

**Expense analysis:**
```bash
python ~/.claude/skills/zenmoney/executor.py --call '{"tool":"get_analytics","arguments":{"start_date":"2026-02-01","end_date":"2026-02-28","type":"expense","group_by":"category"}}'
```

**Add transaction:**
1. `suggest` with payee → get category UUID
2. `get_accounts` → get account UUID
3. `create_transaction` with type/amount/account_id/category_ids

**Budget check:** `get_budgets` + `get_analytics` + `get_accounts` → remaining capacity

## Smart Features

- Natural dates: "в этом месяце" → current month; "в январе" → 2026-01-01/31; "за 30 дней" → last 30d
- ML categories: always call `suggest(payee)` before creating a transaction
- Auto context: "Сколько потратил?" → current month analytics; "Баланс" → accounts
