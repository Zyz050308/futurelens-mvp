import { NextRequest, NextResponse } from 'next/server';
import { isLegacyFeatureAllowed, LEGACY_DISABLED_ERROR } from '@/lib/legacyAccess';

const LEGACY_PAGE_PREFIXES = ['/admin', '/pipeline', '/feed', '/news'];
const LEGACY_API_PREFIXES = ['/api/pipeline/run', '/api/ai/analyze'];

function isLegacyPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  if (isLegacyFeatureAllowed()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isLegacyPath(pathname, LEGACY_API_PREFIXES)) {
    return NextResponse.json({ error: LEGACY_DISABLED_ERROR }, { status: 403 });
  }

  if (isLegacyPath(pathname, LEGACY_PAGE_PREFIXES)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/pipeline/:path*',
    '/feed/:path*',
    '/news/:path*',
    '/api/pipeline/run/:path*',
    '/api/ai/analyze/:path*',
  ],
};
