import { NextRequest, NextResponse } from 'next/server'

// SECURITY MIDDLEWARE — adds HTTP security headers to every response,
// and enforces HTTPS in production.
//
// Headers added:
//  - Content-Security-Policy: prevents XSS, clickjacking, mixed content
//  - X-Frame-Options: legacy clickjacking prevention (older browsers)
//  - X-Content-Type-Options: prevents MIME-type sniffing
//  - Referrer-Policy: limits Referer header leakage
//  - Strict-Transport-Security: forces HTTPS for 1 year (production only)
//  - Permissions-Policy: disables camera/mic/geolocation from non-own-origin
//  - X-DNS-Prefetch-Control: reduces DNS prefetch leakage
//
// NOTE: We allow 'unsafe-inline' for scripts+styles because Next.js inline
// runtime chunks require it. For a production deployment you'd want to move
// to nonces, but that requires Next.js nonce support which is beyond scope
// of this fix.
const csp = [
  "default-src 'self'",
  // Next.js needs inline runtime + eval in dev. In production we can lock down further.
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'", // equivalent to X-Frame-Options: DENY
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

export function proxy(req: NextRequest) {
  // HTTPS redirect in production (skip for localhost / preview)
  const proto = req.headers.get('x-forwarded-proto') || ''
  const host = req.headers.get('host') || ''
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction && proto === 'http' && !host.startsWith('localhost')) {
    const url = req.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  const res = NextResponse.next()

  // Add security headers
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()')

  // HSTS — only in production, only over HTTPS. 1 year + preload.
  if (isProduction && (proto === 'https' || req.nextUrl.protocol === 'https:')) {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return res
}

export const config = {
  // Run on all routes except Next.js internals + static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
