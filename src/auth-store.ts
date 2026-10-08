import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface UserCredential extends User {
  passwordHash: string;
}

export class AuthenticationError extends Error {}

function passwordHash(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password: string, storedHash: string) {
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export class AuthStore {
  private users = new Map<string, UserCredential>();
  private sessions = new Map<string, string>();

  constructor() {
    this.addUser({ id: "user-demo", email: "demo@vynl.kr", name: "VYNL 관리자", role: "ADMIN", password: "vynl1234" });
    this.addUser({ id: "user-listener", email: "user@vynl.kr", name: "VYNL 리스너", role: "USER", password: "vynl1234" });
  }

  login(email: unknown, password: unknown) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const user = [...this.users.values()].find((item) => item.email === normalizedEmail);
    if (!user || typeof password !== "string" || !passwordMatches(password, user.passwordHash)) {
      throw new AuthenticationError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    const token = randomBytes(32).toString("base64url");
    this.sessions.set(token, user.id);
    return { token, user: this.publicUser(user) };
  }

  findUserBySession(token: string | undefined) {
    const userId = token && this.sessions.get(token);
    const user = userId && this.users.get(userId);
    return user ? this.publicUser(user) : null;
  }

  logout(token: string | undefined) {
    if (token) this.sessions.delete(token);
  }

  private addUser(user: User & { password: string }) {
    this.users.set(user.id, { id: user.id, email: user.email, name: user.name, role: user.role, passwordHash: passwordHash(user.password) });
  }

  private publicUser(user: UserCredential): User {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}

export const SESSION_COOKIE = "vynl_session";

export function readSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
