import { NextRequest, NextResponse } from 'next/server';

// ================================================================
// PUSDAOP — Vercel Edge Middleware
// Anti-DDoS, Rate Limiting, Bot Protection, Security Headers
// ================================================================

// --- Rate Limiter Configuration ---
const RATE_WINDOWS: Record<string, { limit: number; windowMs: number }> = {
  // General pages: 300 req/min per IP
  default: { limit: 300, windowMs: 60_000 },
  // Login page stricter: 10 req/min (brute force mitigation)
  login: { limit: 10, windowMs: 60_000 },
};

// In-memory store (per edge instance — ephemeral but effective as first line)
const ipStore = new Map<string, { count: number; windowStart: number }>();
let lastCleanup = Date.now();

function getRateWindow(pathname: string) {
  if (pathname === '/login' || pathname === '/') return RATE_WINDOWS.login;
  return RATE_WINDOWS.default;
}

function checkRateLimit(ip: string, pathname: string): {
  limited: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const { limit, windowMs } = getRateWindow(pathname);
  const key = `${ip}:${pathname.startsWith('/login') ? 'login' : 'default'}`;

  // Cleanup stale entries every 5 minutes
  if (now - lastCleanup > 5 * 60_000) {
    for (const [k, v] of ipStore.entries()) {
      if (now - v.windowStart > windowMs * 2) ipStore.delete(k);
    }
    lastCleanup = now;
  }

  const record = ipStore.get(key);
  if (!record || now - record.windowStart > windowMs) {
    ipStore.set(key, { count: 1, windowStart: now });
    return { limited: false, remaining: limit - 1, resetAt: now + windowMs };
  }

  record.count++;
  const remaining = Math.max(0, limit - record.count);
  const resetAt = record.windowStart + windowMs;
  return { limited: record.count > limit, remaining, resetAt };
}

// --- Bot / Scanner Detection ---
const BLOCKED_USER_AGENTS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
  'python-requests', 'go-http-client', 'libwww-perl',
  'curl/', 'wget/', 'scrapy', 'acunetix',
];

function isSuspiciousBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some(blocked => ua.includes(blocked));
}

// --- Suspicious Path Detection (common scanner patterns) ---
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/phpmyadmin', '/.env',
  '/admin.php', '/xmlrpc.php', '/.git', '/etc/passwd',
  '/shell.php', '/backdoor', '/eval-stdin',
  '/setup.php', '/install.php', '/config.php',
];

function isSuspiciousPath(pathname: string): boolean {
  return BLOCKED_PATHS.some(p => pathname.toLowerCase().includes(p));
}

// ================================================================
// Main Middleware
// ================================================================
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') ?? '';
  const ip =
    request.ip ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  // 1. Skip static assets — let CDN handle these
  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff2?|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Block scanner/attacker paths immediately
  if (isSuspiciousPath(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. Block known malicious bots/scanners
  if (isSuspiciousBot(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 4. Rate limiting
  const { limited, remaining, resetAt } = checkRateLimit(ip, pathname);
  if (limited) {
    return new NextResponse(
      JSON.stringify({
        error: 'Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(getRateWindow(pathname).limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }

  // 5. Pass through with rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
};
