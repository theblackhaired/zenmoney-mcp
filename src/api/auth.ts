import { AuthData, AuthCredentials } from './types.js';

const BASE_URL = 'https://api.zenmoney.ru';
const REDIRECT_URL = 'http://0.0.0.0';

export async function authenticate(credentials: AuthCredentials): Promise<AuthData> {
  // Step 1: Collect cookies
  const authUrl = `${BASE_URL}/oauth2/authorize?response_type=code&client_id=${credentials.apiKey}&redirect_uri=${REDIRECT_URL}`;
  const cookieResponse = await fetch(authUrl, { redirect: 'manual' });
  const cookies = extractCookies(cookieResponse);

  // Step 2: Submit credentials, get auth code
  const formData = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
    auth_type_password: 'Sign in',
  });

  const codeResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: formData.toString(),
    redirect: 'manual',
  });

  const location = codeResponse.headers.get('location');
  if (!location) throw new Error('Failed to get auth code: no redirect');

  const code = new URL(location).searchParams.get('code');
  if (!code) throw new Error('Failed to get auth code from redirect URL');

  // Step 3: Exchange code for token
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: credentials.apiKey,
    client_secret: credentials.apiSecret,
    code,
    redirect_uri: REDIRECT_URL,
  });

  const tokenResponse = await fetch(`${BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }

  const data = await tokenResponse.json();
  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  };
}

function extractCookies(response: Response): string {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  return setCookies.map(c => c.split(';')[0]).join('; ');
}
