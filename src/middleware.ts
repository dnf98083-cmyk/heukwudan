import { NextRequest, NextResponse } from "next/server";

// API auth 경로와 로그인 페이지는 열어둠
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const session = request.cookies.get("hk_session");
    // 이미 로그인 상태에서 /login 접근 → 홈으로
    if (pathname === "/login" && session?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 세션 쿠키 없으면 로그인 페이지로
  const session = request.cookies.get("hk_session");
  if (!session?.value) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
