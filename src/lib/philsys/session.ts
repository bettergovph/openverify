const VERIFY_URL = 'https://verify.philsys.gov.ph/';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

type CookieCache = {
  value: string;
  expiresAt: number;
};

let cachedCookie: CookieCache | null = null;

function resolveSetCookie(response: Response): string[] {
  const headerObj = response.headers as unknown as { getSetCookie?: () => string[] };
  const getSetCookie = headerObj.getSetCookie?.bind(headerObj);
  if (!getSetCookie) {
    const cookieHeader = response.headers.get('set-cookie');
    return cookieHeader ? [cookieHeader] : [];
  }
  return getSetCookie();
}

function stripCookieAttributes(cookie: string): string {
  return cookie.split(';')[0]?.trim() ?? '';
}

function buildCookieString(cookies: string[]): string | null {
  const parts = cookies.map(stripCookieAttributes).filter(Boolean);
  return parts.length ? parts.join('; ') : null;
}

export async function getPhilSysCookie(): Promise<string | null> {
  const envCookie = process.env.PHILSYS_VERIFY_COOKIE?.trim();
  if (envCookie) {
    return envCookie;
  }

  if (cachedCookie && cachedCookie.expiresAt > Date.now()) {
    return cachedCookie.value;
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'GET',
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': DEFAULT_USER_AGENT,
      },
      redirect: 'follow',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[PhilSys] Failed to bootstrap cookie. Status:', response.status);
      return null;
    }

    const cookieValue = buildCookieString(resolveSetCookie(response));

    if (!cookieValue) {
      console.warn('[PhilSys] No Set-Cookie headers received from PhilSys.');
      return null;
    }

    cachedCookie = {
      value: cookieValue,
      // PhilSys cookies (ga, verify token) typically last for minutes. Cache short to be safe.
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    return cookieValue;
  } catch (error) {
    console.error('[PhilSys] Error while bootstrapping cookie:', error);
    return null;
  }
}

export function setPhilSysCookie(cookie: string): void {
  cachedCookie = {
    value: cookie,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
}

export function capturePhilSysCookies(response: Response): void {
  const cookieValue = buildCookieString(resolveSetCookie(response));
  if (cookieValue) {
    setPhilSysCookie(cookieValue);
  }
}
