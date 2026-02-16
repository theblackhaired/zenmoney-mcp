#!/usr/bin/env node
/**
 * Browser-based OAuth2 authorization for ZenMoney
 * Opens browser, gets user consent, captures token
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const REDIRECT_URI = 'http://localhost:3000/callback';
const ZENMONEY_AUTH_URL = 'https://api.zenmoney.ru/oauth2/authorize';
const ZENMONEY_TOKEN_URL = 'https://api.zenmoney.ru/oauth2/token';

// You need to register your app at http://developers.zenmoney.ru/
// For now, using placeholder - user should set these as env vars
const CLIENT_ID = process.env.ZENMONEY_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.ZENMONEY_CLIENT_SECRET || 'your_client_secret';

let server;

console.log('\n🔐 ZenMoney OAuth Authorization\n');

if (CLIENT_ID === 'your_client_id' || CLIENT_SECRET === 'your_client_secret') {
  console.error('❌ Error: ZENMONEY_CLIENT_ID and ZENMONEY_CLIENT_SECRET must be set');
  console.error('   Get credentials from: http://developers.zenmoney.ru/');
  console.error('   Then set: export ZENMONEY_CLIENT_ID=xxx');
  console.error('             export ZENMONEY_CLIENT_SECRET=xxx');
  process.exit(1);
}

// Start local HTTP server to receive OAuth callback
server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      console.error(`\n❌ Authorization failed: ${error}`);
      server.close();
      process.exit(1);
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ No authorization code received</h1>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      console.error('\n❌ No authorization code in callback');
      server.close();
      process.exit(1);
      return;
    }

    // Exchange code for token
    console.log('📥 Received authorization code, exchanging for token...');

    try {
      const tokenResponse = await fetch(ZENMONEY_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Save token to .mcp.json
      const mcpConfigPath = join(projectRoot, '.mcp.json');
      let mcpConfig;

      try {
        const configText = await readFile(mcpConfigPath, 'utf-8');
        mcpConfig = JSON.parse(configText);
      } catch (err) {
        // Create new config if doesn't exist
        mcpConfig = {
          mcpServers: {
            zenmoney: {
              command: 'node',
              args: [join(projectRoot, 'dist', 'index.js')],
              env: {},
            },
          },
        };
      }

      // Update token
      mcpConfig.mcpServers.zenmoney.env.ZENMONEY_TOKEN = accessToken;

      // Remove old credentials if they exist
      delete mcpConfig.mcpServers.zenmoney.env.ZENMONEY_USERNAME;
      delete mcpConfig.mcpServers.zenmoney.env.ZENMONEY_PASSWORD;
      delete mcpConfig.mcpServers.zenmoney.env.ZENMONEY_API_KEY;
      delete mcpConfig.mcpServers.zenmoney.env.ZENMONEY_API_SECRET;

      await writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

      console.log('✅ Token saved to .mcp.json');
      console.log('🎉 Authorization complete! Restart Claude Code to use the new token.\n');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>Token has been saved. You can close this window.</p>
            <p style="color: #666; font-size: 14px;">Restart Claude Code to use the new token.</p>
          </body>
        </html>
      `);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    } catch (err) {
      console.error(`\n❌ Error exchanging code for token: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>${err.message}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      setTimeout(() => {
        server.close();
        process.exit(1);
      }, 1000);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => {
  const authUrl = `${ZENMONEY_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log('🌐 Starting local server on http://localhost:3000');
  console.log('🚀 Opening browser for authorization...\n');
  console.log(`   If browser doesn't open, visit: ${authUrl}\n`);

  // Open browser
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [authUrl], { shell: true, detached: true, stdio: 'ignore' }).unref();
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ Authorization cancelled');
  server.close();
  process.exit(0);
});
