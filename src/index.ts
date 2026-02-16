#!/usr/bin/env node

import { createServer } from './server.js';

async function main() {
  const token = process.env.ZENMONEY_TOKEN;
  const username = process.env.ZENMONEY_USERNAME;
  const password = process.env.ZENMONEY_PASSWORD;
  const apiKey = process.env.ZENMONEY_API_KEY;
  const apiSecret = process.env.ZENMONEY_API_SECRET;

  const hasToken = !!token;
  const hasCredentials = !!(username && password && apiKey && apiSecret);

  if (!hasToken && !hasCredentials) {
    console.error(
      '❌ ZenMoney MCP Server: No authentication configured.\n\n' +
      '🔐 Quick Start (choose one):\n\n' +
      '1️⃣  Get token from BUDGERA (easiest):\n' +
      '   → Open: https://budgera.com/settings/export\n' +
      '   → Copy token and paste to .mcp.json\n' +
      '   → Restart Claude Code\n\n' +
      '2️⃣  Authorize via browser:\n' +
      '   → Run: npm run auth\n' +
      '   → Token saved automatically\n' +
      '   → Restart Claude Code\n\n' +
      '📝 Manual: Set ZENMONEY_TOKEN in .mcp.json:\n' +
      '   {"mcpServers": {"zenmoney": {"env": {"ZENMONEY_TOKEN": "your_token"}}}}\n'
    );
    process.exit(1);
  }

  const server = createServer({
    token: token,
    credentials: hasCredentials ? { username: username!, password: password!, apiKey: apiKey!, apiSecret: apiSecret! } : undefined,
  });

  await server.start();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
