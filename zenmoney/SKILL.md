---
name: zenmoney
description: "Personal finance management through ZenMoney API. Use when the user needs to: (1) Analyze spending and income (expenses by category, monthly budgets, financial analytics), (2) Create or modify transactions (add expenses, record income, transfers between accounts), (3) View account balances and financial data, (4) Plan budget or check financial capacity for purchases, (5) Work with reminders and scheduled payments, (6) Get ML-powered category suggestions for transactions. Triggers include questions about money, spending, budgets, accounts, or any financial management tasks in Russian or English."
---

# ZenMoney Personal Finance Assistant

Управляй финансами через ZenMoney API в Claude Code. Анализируй расходы, создавай транзакции, планируй бюджет через естественный диалог.

## Quick Start

### Initial Setup

If MCP server is not configured yet:

```bash
# 1. Build the project
npm install && npm run build

# 2. Get token (choose one):

# Option A: From BUDGERA (easiest for existing users)
# Open https://budgera.com/settings/export
# Copy token and paste into .mcp.json as ZENMONEY_TOKEN

# Option B: Browser OAuth
npm run auth

# 3. Restart Claude Code
```

### Common Commands

**Financial Analysis:**
- "Сколько я потратил в этом месяце?"
- "Покажи расходы по категориям за январь"
- "Смогу ли я отвести девушку на свидание?"

**Transaction Management:**
- "Добавь расход 500 рублей на кофе"
- "Создай перевод 10000 с карты на наличные"

**Data Viewing:**
- "Покажи все мои счета"
- "Запланированные платежи на этот месяц"

## Core Tools (22 total)

### Read Tools (7)

**`get_accounts`** - View all accounts with balances
- `include_archived` - Include archived accounts

**`get_transactions`** - Get transactions for a period
- `start_date` (required) - Start date (yyyy-MM-dd)
- `end_date` - End date (default: today)
- `account_id`, `category_id`, `type` - Filters
- `limit` - Max results (default: 100, max: 500)

**`get_categories`** - Get all categories in hierarchical structure

**`get_instruments`** - Get currencies and exchange rates

**`get_budgets`** - View budgets for a month
- `month` (required) - Month in yyyy-MM format

**`get_reminders`** - View scheduled payments
- `include_processed` - Include processed reminders

**`get_analytics`** - Spending/income analytics with grouping
- `start_date` (required), `end_date`
- `group_by` - 'category', 'account', 'merchant' (default: 'category')
- `type` - 'expense', 'income', 'all' (default: 'expense')

**`suggest`** - ML-powered category suggestions
- `payee` (required) - Merchant/payee name

### Write Tools (12)

**`create_transaction`** - Create new transaction
- `type` (required) - 'expense', 'income', 'transfer'
- `amount` (required) - Amount (positive number)
- `account_id` (required) - Account UUID
- `to_account_id` - Destination account (for transfers)
- `category_ids`, `date`, `payee`, `comment`

**`update_transaction`** - Modify existing transaction
- `id` (required) - Transaction UUID
- `amount`, `category_ids`, `payee`, `comment`

**`delete_transaction`** - Delete transaction (soft-delete)
- `id` (required) - Transaction UUID

**`create_account`** - Create new account
- `title`, `type`, `currency_id` (required)
- `balance`, `credit_limit`

**`create_reminder`** - Create recurring reminder
- `type`, `amount`, `account_id`, `interval` (required)
- `points`, `start_date`, `end_date`, `payee`, `comment`

**`update_reminder`** - Modify existing reminder

**`delete_reminder`** - Delete recurring reminder

**`create_reminder_marker`** - Create one-time reminder
- `type`, `amount`, `account_id`, `date` (required)
- Perfect for salary/payments that vary each month

**`delete_reminder_marker`** - Delete one-time reminder marker

**`create_budget`** - Create/update budget limit for category
- `month`, `category` (required)
- `income`, `outcome`, `income_lock`, `outcome_lock`

**`update_budget`** - Modify existing budget

**`delete_budget`** - Remove budget limit

### System Tools (1)

**`check_auth_status`** - Verify auth token validity

For full tool reference with all parameters and examples, see [tools-full.md](references/tools-full.md).

## Usage Examples

### Example 1: Monthly Expense Analysis

```
User: Сколько я потратил в феврале 2026?

Claude:
1. get_analytics(start_date="2026-02-01", end_date="2026-02-28", type="expense", group_by="category")
2. Shows:
   - Total expenses
   - Top-5 categories by spending
   - Percentage distribution
```

### Example 2: Date Planning Budget Check

```
User: Смогу ли я отвести девушку на свидание в этом месяце?

Claude:
1. get_budgets(month="2026-02") → check "Рестораны/Развлечения" budget
2. get_analytics(start_date="2026-02-01") → current spending
3. get_accounts() → available balances
4. Analyzes remaining budget and gives recommendation
```

### Example 3: Quick Expense Entry

```
User: Купил кофе за 250 рублей

Claude:
1. suggest(payee="кофе") → get ML category suggestion
2. get_accounts() → find primary account
3. create_transaction(type="expense", amount=250, payee="Кофе", category_ids=[...])
4. Confirms: "✅ Добавлен расход 250₽ на кофе"
```

## Smart Features

### Auto Context Detection

Claude understands queries without precise wording:
- "Сколько потратил?" → current month expenses
- "Добавь кофе 200р" → create expense with ML category
- "Баланс" → show all accounts
- "Свидание" → entertainment budget analysis

### ML Category Suggestions

When creating transactions, Claude:
1. Uses `suggest` for ML-powered category hints
2. Proposes most likely category
3. Asks confirmation if uncertain

### Natural Date Parsing

Supports intuitive date expressions:
- "в этом месяце" → current calendar month
- "за последние 30 дней" → last 30 days from today
- "в январе" → 2026-01-01 to 2026-01-31
- "в прошлом году" → entire previous year

### Multi-currency Support

Automatically:
- Shows balances in account's native currency
- Uses exchange rates from `get_instruments`
- Converts when necessary

## Additional Resources

- **Troubleshooting**: See [troubleshooting.md](references/troubleshooting.md) for auth issues, empty results, token expiration
- **Advanced Usage**: See [advanced.md](references/advanced.md) for custom periods, bulk operations, integrations
- **Full Tool Reference**: See [tools-full.md](references/tools-full.md) for complete documentation of all 22 tools

## Architecture

```
[Claude Code] → [ZenMoney Skill] → [MCP Server] → [ZenMoney API]
                                           ↓
                                      [DataCache]
```

**Caching:**
- First request: full sync of all data
- Subsequent: incremental sync (only changes)
- Cache stored in memory (resets on restart)

**Security:**
- Token stored in `.mcp.json` (git-ignored)
- All requests via HTTPS
- Auto token refresh on expiration (credential-based auth)
