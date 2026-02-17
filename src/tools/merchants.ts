import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';

export function registerMerchantTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_merchants',
    'Get ZenMoney merchants. Optionally filter by search query.',
    {
      search: z.string().optional().describe('Search merchants by name (case-insensitive)'),
      limit: z.number().optional().default(50).describe('Max results (default: 50)'),
    },
    async ({ search, limit }) => {
      await cache.ensureInitialized();

      let merchants = Array.from(cache.merchants.values());

      if (search) {
        const q = search.toLowerCase();
        merchants = merchants.filter(m => m.title.toLowerCase().includes(q));
      }

      const total = merchants.length;
      const effectiveLimit = Math.min(limit, 200);
      const limited = merchants.slice(0, effectiveLimit);
      const formatted = limited.map(m => ({ id: m.id, title: m.title }));

      const result: Record<string, unknown> = { merchants: formatted };
      if (total > effectiveLimit) {
        result.truncated = true;
        result.total = total;
        result.showing = effectiveLimit;
      }

      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );
}
