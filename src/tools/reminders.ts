import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';
import { formatReminder } from '../utils/format.js';

export function registerReminderTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_reminders',
    'Get scheduled payment reminders. Shows recurring transactions and their markers.',
    {
      include_processed: z.boolean().optional().default(false).describe('Include already processed reminders'),
    },
    async ({ include_processed }) => {
      await cache.ensureInitialized();

      const reminders = Array.from(cache.reminders.values())
        .map(r => {
          const formatted = formatReminder(r, cache.accounts, cache.tags);

          // Attach markers
          const markers = Array.from(cache.reminderMarkers.values())
            .filter(m => m.reminder === r.id)
            .filter(m => include_processed || m.state === 'planned')
            .map(m => ({
              id: m.id,
              date: m.date,
              state: m.state,
              income: m.income || undefined,
              outcome: m.outcome || undefined,
            }));

          return { ...formatted, markers: markers.length > 0 ? markers : undefined };
        });

      return { content: [{ type: 'text', text: JSON.stringify(reminders, null, 2) }] };
    }
  );
}
