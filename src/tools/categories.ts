import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DataCache } from '../utils/cache.js';

export function registerCategoryTools(server: McpServer, cache: DataCache): void {
  server.tool(
    'get_categories',
    'Get all ZenMoney categories (tags). Returns hierarchical list with parent-child relationships.',
    {},
    async () => {
      await cache.ensureInitialized();

      const tags = Array.from(cache.tags.values());

      // Build tree: group by parent
      const roots = tags.filter(t => !t.parent);
      const children = tags.filter(t => t.parent);

      const tree = roots.map(root => {
        const childList = children
          .filter(c => c.parent === root.id)
          .map(c => ({ id: c.id, title: c.title }));
        return {
          id: root.id,
          title: root.title,
          ...(childList.length > 0 ? { children: childList } : {}),
        };
      });

      return { content: [{ type: 'text', text: JSON.stringify(tree) }] };
    }
  );
}
