import { type SessionOptions } from "iron-session";

export type UserRole = "슈퍼개발자" | "관리자" | "연구원" | "길드원";

export interface SessionData {
  userId: string;
  nickname: string;
  role: UserRole;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "hk_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
  },
};
