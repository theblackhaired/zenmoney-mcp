---
name: zenmoney
description: ZenMoney personal finance - accounts, transactions, analytics, budgets. Use when user mentions finances, expenses, income, accounts, budgets, or money tracking.
version: 1.0.0
---

# ZenMoney Personal Finance Skill

Manage personal finances through ZenMoney API. Analyze spending, create transactions, check budgets — all via natural conversation.

No direct MCP connection required — the skill uses `executor.py` to communicate with the MCP server dynamically.

## When to Use

- User asks about finances, spending, income, budgets
- User wants to add/edit/delete transactions
- User asks about account balances
- User mentions money, expenses, payments, categories

## Available Tools

### Read
- `get_accounts` - All accounts with balances (params: `include_archived`)
- `get_transactions` - Transactions by date range (params: `start_date` required, `end_date`, `account_id`, `category_id`, `limit`)
- `get_categories` - Hierarchical category structure
- `get_merchants` - Merchant database
- `get_budgets` - Monthly budget limits (params: `month` required, format yyyy-MM)
- `get_reminders` - Scheduled payments (params: `include_processed`)
- `get_instruments` - Currencies and exchange rates

### Write
- `create_transaction` - Create expense/income/transfer (params: `type` required, `amount` required, `account_id` required, `to_account_id`, `category_ids`, `date`, `payee`, `comment`)
- `update_transaction` - Modify transaction (params: `id` required, `amount`, `category_ids`, `payee`, `comment`)
- `delete_transaction` - Remove transaction (params: `id` required)
- `create_account` - Add account (params: `title` required, `type` required [cash/ccard/checking], `currency_id` required, `balance`, `credit_limit`)
- `create_reminder` - Recurring scheduled transaction
- `create_reminder_marker` - One-time reminder
- `update_reminder` - Modify reminder
- `delete_reminder` - Remove reminder
- `delete_reminder_marker` - Remove one-time marker

### Analytics
- `get_analytics` - Spending analysis (params: `start_date` required, `end_date`, `group_by` [category/account/merchant], `type` [expense/income/all])
- `suggest` - ML category suggestions (params: `payee` required)

### System
- `check_auth_status` - Verify token validity

## How to Execute

All tool calls go through `executor.py` via Bash. Replace `$SKILL_DIR` with the actual path to this skill directory.

```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "TOOL_NAME", "arguments": {ARGS}}'
```

### Examples

**Get all accounts:**
```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "get_accounts", "arguments": {}}'
```

**Transactions this month:**
```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "get_transactions", "arguments": {"start_date": "2026-02-01"}}'
```

**Spending analytics by category:**
```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "get_analytics", "arguments": {"start_date": "2026-02-01", "group_by": "category", "type": "expense"}}'
```

**Create expense:**
```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "create_transaction", "arguments": {"type": "expense", "amount": 500, "account_id": "ACCOUNT_UUID", "payee": "Coffee", "category_ids": ["CATEGORY_UUID"]}}'
```

**ML category suggestion:**
```bash
cd $SKILL_DIR && python executor.py --call '{"tool": "suggest", "arguments": {"payee": "Starbucks"}}'
```

**Get tool schema (if unsure about params):**
```bash
cd $SKILL_DIR && python executor.py --describe get_analytics
```

**List all tools:**
```bash
cd $SKILL_DIR && python executor.py --list
```

## Workflow Patterns

### Adding an expense
1. `suggest` with payee name -> get category
2. `get_accounts` -> find the right account
3. `create_transaction` with type=expense

### Monthly report
1. `get_analytics` with start/end dates, group_by=category
2. `get_budgets` for the month
3. Compare and summarize

### Quick balance check
1. `get_accounts` -> show balances

## Natural Date Mapping
- "this month" -> start_date: first day of current month
- "last 30 days" -> start_date: today minus 30 days
- "in January" -> start_date: 2026-01-01, end_date: 2026-01-31

## Notes
- First call triggers full sync (may take a few seconds)
- Subsequent calls use incremental sync (fast)
- All amounts are positive numbers
- Dates in yyyy-MM-dd format
- UUIDs needed for account_id, category_id — get them from get_accounts/get_categories first
