import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';
import type { Instrument } from '../api/types.js';

export function registerInstrumentTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_instruments',
    'Get currencies with IDs, codes, symbols and rates. By default shows only currencies used in your accounts.',
    {
      include_all: z.boolean().optional().default(false).describe('Include all currencies, not just those used in accounts'),
    },
    async ({ include_all }) => {
      await cache.ensureInitialized();

      let instruments: Instrument[];
      if (include_all) {
        instruments = Array.from(cache.instruments.values());
      } else {
        // Get instrument IDs used in accounts
        const usedIds = new Set<number>();
        for (const account of cache.accounts.values()) {
          usedIds.add(account.instrument);
        }
        instruments = Array.from(cache.instruments.values()).filter(i => usedIds.has(i.id));
      }

      const formatted = instruments.map(i => ({
        id: i.id,
        code: i.shortTitle,
        title: i.title,
        symbol: i.symbol,
        rate: i.rate,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(formatted) }] };
    }
  );
}
