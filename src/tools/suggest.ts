import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZenMoneyClient } from '../api/client.js';

export function registerSuggestTools(server: McpServer, client: ZenMoneyClient): void {
  server.tool(
    'suggest',
    'Get category and merchant suggestions for a payee name. Uses ZenMoney ML to suggest the best category for a transaction.',
    {
      payee: z.string().describe('Payee/merchant name to get suggestions for'),
    },
    async ({ payee }) => {
      const suggestions = await client.suggest({ payee });
      return { content: [{ type: 'text', text: JSON.stringify(suggestions, null, 2) }] };
    }
  );
}
