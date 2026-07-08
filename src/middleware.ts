import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Bỏ qua tất cả API routes ở middleware để tránh lỗi buffer body (413 Payload Too Large) khi upload file
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
  const isAssignmentStartRoute = pathname.startsWith('/assignments/') && pathname.endsWith('/start')
  const isPublicRoute = publicRoutes.some(route => pathname === route) || isAssignmentStartRoute

  // Admin routes (handled separately by admin auth)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  // API routes should return their own JSON/status responses instead of being redirected
  const isApiRoute = pathname.startsWith('/api/')

  if (isApiRoute) {
    return supabaseResponse
  }

  // Student routes (require auth)
  const isStudentRoute = pathname === '/' || pathname.startsWith('/assignments')

  if (!user && !isPublicRoute && !isAdminRoute) {
    // Redirect unauthenticated users to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Redirect authenticated users away from login/signup
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes - bypass middleware to allow large payloads)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    // Exclude common static asset patterns (images, json, manifest) so middleware
    // won't intercept requests for them and accidentally redirect to /login.
    '/((?!_next/static|_next/image|api/|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|webmanifest)$).*)',
  ],
}
