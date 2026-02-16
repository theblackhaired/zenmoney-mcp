import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';

export function registerMerchantTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_merchants',
    'Get ZenMoney merchants (named payees). Optionally filter by search query.',
    {
      search: z.string().optional().describe('Search merchants by name (case-insensitive)'),
    },
    async ({ search }) => {
      await cache.ensureInitialized();

      let merchants = Array.from(cache.merchants.values());

      if (search) {
        const q = search.toLowerCase();
        merchants = merchants.filter(m => m.title.toLowerCase().includes(q));
      }

      const formatted = merchants.map(m => ({ id: m.id, title: m.title }));
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    }
  );
}
