import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 로그인이 필요한 경로 정의
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/profile") || path === "/"

  // 로그인 관련 경로 정의
  const isAuthRoute = path === "/login"

  // 쿠키에서 사용자 ID 확인
  const userId = request.cookies.get("user_id")?.value

  // 로그인되지 않은 사용자가 보호된 경로에 접근하려는 경우
  if (isProtectedRoute && !userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 이미 로그인된 사용자가 로그인 페이지에 접근하려는 경우
  if (isAuthRoute && userId) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 미들웨어를 적용할 경로 패턴을 지정합니다.
     * '/((?!api|_next/static|_next/image|favicon.ico).*)'는
     * api, _next/static, _next/image, favicon.ico를 제외한 모든 경로에 미들웨어를 적용합니다.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

