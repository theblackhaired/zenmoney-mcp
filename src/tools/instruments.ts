import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';

export function registerInstrumentTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_instruments',
    'Get available currencies with their IDs, codes, symbols and exchange rates. Use currency IDs when creating accounts or transactions.',
    {},
    async () => {
      await cache.ensureInitialized();

      const instruments = Array.from(cache.instruments.values()).map(i => ({
        id: i.id,
        code: i.shortTitle,
        title: i.title,
        symbol: i.symbol,
        rate: i.rate,
      }));

      return { content: [{ type: 'text', text: JSON.stringify(instruments, null, 2) }] };
    }
  );
}
