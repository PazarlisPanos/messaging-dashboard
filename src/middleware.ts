import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return NextResponse.next()

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isLoggedIn = !!token

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isLoggedIn && isAuthPage) {
    const role = token.role as string
    const clientSlug = token.clientSlug as string | null
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (clientSlug) {
      return NextResponse.redirect(new URL(`/dashboard/${clientSlug}`, request.url))
    }
  }

  if (isLoggedIn) {
    const role = token.role as string
    const clientSlug = token.clientSlug as string | null
    if (role === 'operator' && clientSlug) {
      const clientMatch = pathname.match(/^\/dashboard\/([^/]+)/)
      if (clientMatch && clientMatch[1] !== clientSlug) {
        return NextResponse.redirect(new URL(`/dashboard/${clientSlug}`, request.url))
      }
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        return NextResponse.redirect(new URL(`/dashboard/${clientSlug}`, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\.ico|logo\.png|favicon-.*\.png|apple-touch.*\.png|android-chrome.*\.png|icon\.png).*)'],
}
