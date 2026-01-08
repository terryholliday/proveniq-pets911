/**
 * Domain Architecture Middleware
 * Per CANONICAL_LAW.md: Enforces domain-based routing
 * 
 * DOMAIN MAPPING:
 * - lostpets911.org      → Owner/Panic flows (Emergency Finder Assist, Missing Pet Report)
 * - petrescue911.org     → Finder/Municipal flows (Found Animal Report, Sighting Report)
 * - proveniqpets911.org  → Admin/API routes (Moderator Console, API endpoints)
 * 
 * localhost: Full access for development
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domain configuration
const DOMAIN_CONFIG = {
  // Owner/Panic domain - lost pets, emergency assist
  OWNER: {
    hostnames: ['lostpets911.org', 'www.lostpets911.org'],
    allowedPaths: [
      '/',
      '/emergency',
      '/missing',
      '/missing/(.*)',
      '/case/(.*)',
      '/sightings',
      '/sightings/(.*)',
      '/api/sightings',
      '/api/sightings/(.*)',
      '/_next/(.*)',
      '/favicon.ico',
      '/manifest.json',
      '/icon-(.*).png',
    ],
    redirectTo: '/',
    label: 'LostPets911',
  },

  // Finder/Municipal domain - found animals, sighting reports
  FINDER: {
    hostnames: ['petrescue911.org', 'www.petrescue911.org'],
    allowedPaths: [
      '/',
      '/found',
      '/found/(.*)',
      '/sighting',
      '/sighting/(.*)',
      '/sightings',
      '/sightings/(.*)',
      '/api/sightings',
      '/api/sightings/(.*)',
      '/report',
      '/report/(.*)',
      '/_next/(.*)',
      '/favicon.ico',
      '/manifest.json',
      '/icon-(.*).png',
    ],
    redirectTo: '/',
    label: 'PetRescue911',
  },

  // Admin/API domain - moderator console, all API routes
  ADMIN: {
    hostnames: ['proveniqpets911.org', 'www.proveniqpets911.org'],
    allowedPaths: [
      '/',
      '/admin/(.*)',
      '/api/(.*)',
      '/moderator/(.*)',
      '/_next/(.*)',
      '/favicon.ico',
      '/manifest.json',
      '/icon-(.*).png',
    ],
    redirectTo: '/admin/pigpig',
    label: 'ProveniqPets911 Admin',
  },
} as const;

// Development hostnames - full access
const DEV_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

type DomainType = keyof typeof DOMAIN_CONFIG;

/**
 * Determine domain type from hostname
 */
function getDomainType(hostname: string): DomainType | 'DEV' | null {
  // Robust hostname extraction (handles port and IPv6)
  let host = hostname.toLowerCase();

  if (host.includes('[')) {
    // Bracketed IPv6: [::1]:3000 -> ::1
    host = host.split(']')[0].substring(1);
  } else if ((host.match(/:/g) || []).length > 1) {
    // raw IPv6: ::1 -> ::1 (do nothing, it's the host)
  } else {
    // Normal host or IPv4: localhost:3000 -> localhost
    host = host.split(':')[0];
  }

  // Check development and deployment previews
  if (
    DEV_HOSTNAMES.includes(host) ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.') ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.vercel.app')
  ) {
    return 'DEV';
  }

  // Check each domain config
  const domainTypes = Object.keys(DOMAIN_CONFIG) as DomainType[];
  for (const type of domainTypes) {
    const config = DOMAIN_CONFIG[type];
    if ((config.hostnames as readonly string[]).includes(host)) {
      return type;
    }
  }

  return null;
}

/**
 * Check if path matches any allowed pattern
 */
function isPathAllowed(pathname: string, allowedPaths: readonly string[]): boolean {
  for (const pattern of allowedPaths) {
    // Convert pattern to regex
    const regexPattern = `^${pattern.replace(/\(\.\*\)/g, '.*')}$`;
    const regex = new RegExp(regexPattern);

    if (regex.test(pathname)) {
      return true;
    }
  }
  return false;
}

/**
 * Get domain-specific headers
 */
function getDomainHeaders(domainType: DomainType | 'DEV'): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Proveniq-Domain': domainType,
  };

  if (domainType !== 'DEV' && domainType in DOMAIN_CONFIG) {
    headers['X-Proveniq-Label'] = DOMAIN_CONFIG[domainType].label;
  }

  return headers;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost';

  // Determine domain type
  const domainType = getDomainType(hostname);

  // Unknown domain - block access (fail-closed)
  if (domainType === null) {
    return new NextResponse(
      JSON.stringify({
        error: 'ACCESS_DENIED',
        message: 'Unknown domain. Access denied.',
        hostname,
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Proveniq-Error': 'UNKNOWN_DOMAIN',
        },
      }
    );
  }

  // Development mode - allow all routes
  if (domainType === 'DEV') {
    const response = NextResponse.next();
    response.headers.set('X-Proveniq-Domain', 'DEV');
    response.headers.set('X-Proveniq-Mode', 'development');
    return response;
  }

  // Production domain routing
  const config = DOMAIN_CONFIG[domainType];

  // Check if path is allowed for this domain
  if (!isPathAllowed(pathname, config.allowedPaths)) {
    // API routes return 403 JSON
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'ROUTE_NOT_ALLOWED',
          message: `API route ${pathname} is not available on ${config.label}`,
          domain: domainType,
          allowed_domains: ['proveniqpets911.org'],
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Proveniq-Domain': domainType,
            'X-Proveniq-Error': 'ROUTE_NOT_ALLOWED',
          },
        }
      );
    }

    // Admin routes - redirect with message
    if (pathname.startsWith('/admin/')) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'admin_not_available');
      redirectUrl.searchParams.set('redirect_from', pathname);

      return NextResponse.redirect(redirectUrl, {
        headers: getDomainHeaders(domainType),
      });
    }

    // Other routes - redirect to domain home
    const redirectUrl = new URL(config.redirectTo, request.url);
    return NextResponse.redirect(redirectUrl, {
      headers: getDomainHeaders(domainType),
    });
  }

  // Path allowed - continue with domain headers
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(getDomainHeaders(domainType))) {
    response.headers.set(key, value);
  }

  return response;
}

// Middleware config - run on all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
