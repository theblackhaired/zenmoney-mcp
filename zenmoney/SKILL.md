---
name: zenmoney
description: "Personal finance management through ZenMoney API. Use when the user needs to: (1) Analyze spending and income (expenses by category, monthly budgets, financial analytics), (2) Create or modify transactions (add expenses, record income, transfers between accounts), (3) View account balances and financial data, (4) Plan budget or check financial capacity for purchases, (5) Work with reminders and scheduled payments, (6) Get ML-powered category suggestions for transactions. Triggers include questions about money, spending, budgets, accounts, or any financial management tasks in Russian or English."
---

# ZenMoney Personal Finance Assistant

MCP tools are available directly. Use them for all financial operations.

## Tool Reference (22 tools)

**Read:**
- `get_accounts` — balances; `include_archived`
- `get_transactions` — `start_date`(req), `end_date`, `account_id`, `category_id`, `type`, `limit`(max 500)
- `get_categories` — hierarchical category list
- `get_instruments` — currencies and exchange rates
- `get_budgets` — `month`(req, yyyy-MM)
- `get_reminders` — `include_processed`
- `get_analytics` — `start_date`(req), `end_date`, `group_by`(category/account/merchant), `type`(expense/income/all)
- `suggest` — ML category hint; `payee`(req)

**Write:**
- `create_transaction` — `type`(req: expense/income/transfer), `amount`(req), `account_id`(req), `to_account_id`, `category_ids`, `date`, `payee`, `comment`
- `update_transaction` — `id`(req), any field
- `delete_transaction` — `id`(req)
- `create_account` — `title`, `type`, `currency_id`(req), `balance`, `credit_limit`
- `create_reminder` — `type`, `amount`, `account_id`, `interval`(req: day/week/month/year/null), `points`, `start_date`, `end_date`, `payee`, `comment`
- `update_reminder` / `delete_reminder` — `id`(req)
- `create_reminder_marker` — one-time reminder; `type`, `amount`, `account_id`, `date`(req); auto-creates Reminder if no `reminder_id`
- `delete_reminder_marker` — `id`(req)
- `create_budget` — `month`, `category`(req), `income`, `outcome`, `income_lock`, `outcome_lock`
- `update_budget` / `delete_budget` — `month`, `category`(req)

**System:**
- `check_auth_status` — verify token

## Workflows

**Expense analysis:** `get_analytics(start_date, end_date, type="expense", group_by="category")` → show totals, top categories, % breakdown

**Budget check:** `get_budgets(month)` + `get_analytics(start_date)` + `get_accounts()` → remaining capacity

**Add transaction:** `suggest(payee)` → `get_accounts()` → `create_transaction(..., category_ids=[...])`

## Smart Features

- Natural dates: "в этом месяце" → current month; "в январе" → 2026-01-01/31; "за 30 дней" → last 30d
- ML categories: always call `suggest(payee)` before creating a transaction
- Multi-currency: use `get_instruments` for exchange rates when needed
- Auto context: "Сколько потратил?" → current month; "Баланс" → accounts; "Свидание" → entertainment budget
