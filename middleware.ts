import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // auth API는 항상 허용
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 쿠키 존재 여부로 로그인 확인
  // (실제 세션 검증은 서버 컴포넌트/API에서 iron-session으로 처리)
  const sessionCookie = request.cookies.get("hk_session");
  const isLoggedIn = !!sessionCookie;
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
