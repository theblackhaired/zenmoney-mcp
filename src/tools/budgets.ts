import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';
import { formatBudget } from '../utils/format.js';
import { validateMonth } from '../utils/validation.js';

export function registerBudgetTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_budgets',
    'Get budgets for a specific month. Shows planned income/outcome per category.',
    {
      month: z.string().describe('Month in yyyy-MM format (e.g., 2025-01)'),
    },
    async ({ month }) => {
      validateMonth(month, 'month');
      const monthDate = `${month}-01`;

      await cache.ensureInitialized();

      const budgets = Array.from(cache.budgets.values())
        .filter(b => b.date === monthDate)
        .map(b => formatBudget(b, cache.tags));

      return { content: [{ type: 'text', text: JSON.stringify(budgets, null, 2) }] };
    }
  );
}
