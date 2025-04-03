import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"
import { AUTH_LOGIN_URL, IS_SELF_HOSTED_MODE } from "./lib/constants"

export default async function middleware(request: NextRequest) {
  if (IS_SELF_HOSTED_MODE) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request, { cookiePrefix: "taxhacker" })
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(AUTH_LOGIN_URL, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/transactions/:path*",
    "/settings/:path*",
    "/export/:path*",
    "/import/:path*",
    "/unsorted/:path*",
    "/files/:path*",
    "/dashboard/:path*",
  ],
}
