import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // For now, allow all routes to pass through
  // The authentication is handled client-side via localStorage
  // TODO: Implement proper server-side authentication if needed
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}