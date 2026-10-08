import { authStore } from "../../../../lib/auth-store-instance.ts";
import { readSessionToken } from "../../../../src/auth-store.ts";

export async function GET(request: Request) {
  const user = authStore.findUserBySession(readSessionToken(request));
  return user ? Response.json({ user }) : Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
}
