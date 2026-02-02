import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> };

// Routes that don't require authentication
const publicRoutes = ['/', '/login'];

// Routes that require specific roles (for future role-based access)
// These are defined for documentation purposes and potential future use
// const dispatcherRoutes = ['/dashboard', '/rides', '/drivers', '/patients', '/destinations'];
// const driverRoutes = ['/my-rides', '/my-availability'];

/**
 * Secure cookie options for CSRF protection.
 * Applied to all Supabase session cookies.
 */
function getSecureCookieOptions(
  baseOptions?: Partial<ResponseCookie>
): Partial<ResponseCookie> {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    ...baseOptions,
    // CSRF Protection: SameSite prevents cross-site request forgery
    // 'lax' allows cookies on top-level navigations (good UX)
    // 'strict' would be more secure but breaks some flows
    sameSite: 'lax' as const,
    // Only send cookies over HTTPS in production
    secure: isProduction,
    // Prevent JavaScript access to cookies (XSS protection)
    httpOnly: true,
    // Ensure cookie is sent with all requests to the domain
    path: '/',
  };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Apply secure cookie options
            const secureOptions = getSecureCookieOptions(options);
            supabaseResponse.cookies.set(name, value, secureOptions);
          });
        },
      },
    }
  );

  // Refresh session if expired - getUser validates the session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/api/') || pathname.startsWith('/_next/')
  );

  // If user is not authenticated and route is not public, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and on login page, redirect to dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers to response
  addSecurityHeaders(supabaseResponse);

  return supabaseResponse;
}

/**
 * Adds security headers to the response.
 * Note: Some headers are also set in next.config.ts for static files.
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable certain browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );
}
