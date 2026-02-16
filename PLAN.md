# ZenMoney MCP Server — План реализации

## Обзор

MCP-сервер для Claude Code, предоставляющий полный доступ к ZenMoney API (счета, транзакции, категории, бюджеты, напоминания, аналитика).

## Архитектурные решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Формат | MCP Server (stdio) | Лучший UX — Claude вызывает tools напрямую |
| Стек | TypeScript + @modelcontextprotocol/sdk | Официальный SDK, типобезопасность |
| HTTP-клиент | Свой на native `fetch` | zenmoney-api не поддерживает запись, ESM/CJS конфликт |
| Auth | MCP config args | Credentials в claude_desktop_config.json |
| Типы | Свои, на основе zenmoney-api types.ts | Полный контроль, расширение под наши нужды |

## Структура проекта

```
zenmoney-skill/
├── src/
│   ├── index.ts              # Entry point — запуск MCP server
│   ├── server.ts             # Конфигурация MCP server + регистрация tools
│   ├── api/
│   │   ├── client.ts         # ZenMoney HTTP client (fetch-based)
│   │   ├── auth.ts           # OAuth2 авторизация + auto-refresh
│   │   └── types.ts          # ZenMoney API типы (Account, Transaction, etc.)
│   ├── tools/
│   │   ├── accounts.ts       # get_accounts, create_account
│   │   ├── transactions.ts   # get_transactions, create_transaction, update_transaction, delete_transaction
│   │   ├── categories.ts     # get_categories
│   │   ├── merchants.ts      # get_merchants
│   │   ├── budgets.ts        # get_budgets
│   │   ├── reminders.ts      # get_reminders
│   │   ├── instruments.ts    # get_instruments (валюты)
│   │   ├── analytics.ts      # get_analytics (агрегация расходов)
│   │   └── suggest.ts        # suggest (автокатегоризация)
│   └── utils/
│       ├── cache.ts          # Кэш данных + serverTimestamp management
│       ├── format.ts         # Форматирование ответов для Claude
│       └── validation.ts     # Валидация входных данных
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## MCP Tools (13 штук)

### Чтение данных (7 tools)

#### 1. `get_accounts`
Получить список счетов с балансами.
- **Параметры**: `include_archived?: boolean` (default: false)
- **Возвращает**: массив счетов с id, title, type, balance, currency
- **Лимит**: без лимита (обычно < 20 счетов)

#### 2. `get_transactions`
Получить транзакции с фильтрацией.
- **Параметры**:
  - `start_date: string` (обязательный, yyyy-MM-dd)
  - `end_date?: string` (default: сегодня)
  - `account_id?: string` (фильтр по счёту)
  - `category_id?: string` (фильтр по категории)
  - `limit?: number` (default: 100, max: 500)
- **Возвращает**: массив транзакций с основными полями
- **Важно**: пагинация через offset или date range

#### 3. `get_categories`
Получить все категории/теги.
- **Параметры**: нет
- **Возвращает**: дерево категорий (parent → children)

#### 4. `get_merchants`
Получить список мерчантов.
- **Параметры**: `search?: string` (поиск по имени)
- **Возвращает**: массив мерчантов с id, title

#### 5. `get_budgets`
Получить бюджеты за период.
- **Параметры**: `month: string` (yyyy-MM)
- **Возвращает**: массив бюджетов по категориям

#### 6. `get_reminders`
Получить напоминания о платежах.
- **Параметры**: `include_processed?: boolean` (default: false)
- **Возвращает**: массив напоминаний + их маркеры

#### 7. `get_instruments`
Получить список валют и курсы.
- **Параметры**: нет
- **Возвращает**: массив валют с id, shortTitle, symbol, rate

### Запись данных (4 tools)

#### 8. `create_transaction`
Создать новую транзакцию.
- **Параметры**:
  - `type: 'expense' | 'income' | 'transfer'` (обязательный)
  - `amount: number` (обязательный)
  - `account_id: string` (обязательный — счёт списания для expense, зачисления для income)
  - `to_account_id?: string` (обязательный для transfer)
  - `category_ids?: string[]` (UUID категорий)
  - `date?: string` (default: сегодня)
  - `payee?: string`
  - `comment?: string`
  - `currency_id?: number` (если отличается от валюты счёта)
- **Возвращает**: созданную транзакцию
- **Логика**: маппит type в правильную комбинацию income/outcome полей

#### 9. `update_transaction`
Обновить существующую транзакцию.
- **Параметры**:
  - `id: string` (обязательный — UUID транзакции)
  - Остальные поля опциональны (как в create_transaction)
- **Возвращает**: обновлённую транзакцию
- **Важно**: read-modify-write pattern — сначала читаем актуальную версию

#### 10. `delete_transaction`
Удалить транзакцию (soft-delete через deleted: true).
- **Параметры**: `id: string` (обязательный)
- **Возвращает**: confirmation
- **Логика**: soft-delete — помечаем deleted: true, не hard-delete

#### 11. `create_account`
Создать новый счёт.
- **Параметры**:
  - `title: string` (обязательный)
  - `type: 'cash' | 'ccard' | 'checking'` (обязательный, MVP без loan/deposit)
  - `currency_id: number` (обязательный — id из get_instruments)
  - `balance?: number` (default: 0)
  - `credit_limit?: number` (для ccard)
- **Возвращает**: созданный счёт

### Аналитика (2 tools)

#### 12. `get_analytics`
Агрегация расходов/доходов по категориям.
- **Параметры**:
  - `start_date: string` (обязательный)
  - `end_date?: string`
  - `group_by: 'category' | 'account' | 'merchant'`
  - `type?: 'expense' | 'income' | 'all'` (default: 'expense')
- **Возвращает**: таблицу с суммами по группам, отсортированную по убыванию
- **Важно**: считается на клиенте по данным из diff

#### 13. `suggest`
Получить предложение категории для транзакции.
- **Параметры**: `payee: string` (обязательный)
- **Возвращает**: предложенные category, merchant, normalized payee

## API Client — Ключевые детали

### Авторизация
```
1. Получаем credentials из MCP config args
2. Если есть token — используем его
3. Если есть username/password + apiKey/apiSecret — OAuth2 flow:
   a. GET /oauth2/authorize → cookies
   b. POST /oauth2/authorize → auth code
   c. POST /oauth2/token → access_token + refresh_token
4. При 401 — автоматический re-auth
```

### Diff Protocol (синхронизация)
```
- Храним serverTimestamp в памяти процесса
- Первый вызов: serverTimestamp=0, получаем ВСЕ данные
- Последующие: инкрементальная синхронизация
- Кэшируем данные в памяти для быстрого доступа
- Write: отправляем entity массивы в body POST /v8/diff
```

### Формат MCP Config

```jsonc
// claude_desktop_config.json или .claude.json
{
  "mcpServers": {
    "zenmoney": {
      "command": "node",
      "args": ["path/to/zenmoney-skill/dist/index.js"],
      "env": {
        "ZENMONEY_TOKEN": "your-access-token"
        // ИЛИ
        // "ZENMONEY_USERNAME": "user@email.com",
        // "ZENMONEY_PASSWORD": "password",
        // "ZENMONEY_API_KEY": "consumer_key",
        // "ZENMONEY_API_SECRET": "consumer_secret"
      }
    }
  }
}
```

## Этапы реализации

### Этап 1: Фундамент (каркас проекта)
1. Инициализация npm проекта + TypeScript + MCP SDK
2. Все ZenMoney типы (Account, Transaction, Tag, etc.)
3. HTTP-клиент на fetch с auth support
4. Базовый MCP server с одним tool для проверки

### Этап 2: Чтение данных
5. Diff-based data cache (serverTimestamp management)
6. `get_accounts` tool
7. `get_transactions` tool (с фильтрацией и лимитом)
8. `get_categories`, `get_merchants`, `get_instruments`
9. `get_budgets`, `get_reminders`

### Этап 3: Запись данных
10. UUID генерация для новых сущностей
11. `create_transaction` (expense, income, transfer)
12. `update_transaction` (read-modify-write)
13. `delete_transaction` (soft-delete)
14. `create_account`

### Этап 4: Аналитика + полировка
15. `get_analytics` (клиентская агрегация)
16. `suggest` (proxy к v8/suggest)
17. Валидация входных данных
18. Форматирование ответов для Claude
19. Error handling + auto re-auth
20. README с инструкциями по установке

## Guardrails

- **Лимит ответа**: max 100 записей по умолчанию, max 500 абсолютный
- **Обязательная дата**: get_transactions требует start_date
- **Soft-delete**: удаление через deleted: true, не hard-delete
- **Валидация**: проверка UUID, дат, сумм перед отправкой
- **Re-auth**: автоматическая повторная авторизация при 401
- **Read-modify-write**: обновление всегда читает свежий changed timestamp

## Зависимости

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

Минимум зависимостей — только MCP SDK. HTTP через native fetch, UUID через crypto.randomUUID().
