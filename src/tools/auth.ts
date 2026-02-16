import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZenMoneyClient } from '../api/client.js';

export function registerAuthTools(server: McpServer, client: ZenMoneyClient): void {
  server.tool(
    'check_auth_status',
    'Check current authentication status and token validity. Returns whether the client is authenticated and can make API calls.',
    {},
    async () => {
      try {
        // Try to make a minimal API call to check auth
        await client.diff({ serverTimestamp: 0 });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'authenticated',
                  message: 'Token is valid and working',
                  note: 'ZenMoney API is accessible',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'error',
                  message: 'Authentication failed',
                  error: errorMessage,
                  solution: errorMessage.includes('401')
                    ? 'Token expired. Run: npm run auth'
                    : 'Check your credentials or network connection',
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
