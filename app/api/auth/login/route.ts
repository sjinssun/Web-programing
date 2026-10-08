import { authStore } from "../../../../lib/auth-store-instance.ts";
import { AuthenticationError, sessionCookie } from "../../../../src/auth-store.ts";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const { token, user } = authStore.login(body.email, body.password);
    return Response.json({ user }, { headers: { "set-cookie": sessionCookie(token) } });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) return Response.json({ message: error.message }, { status: 401 });
    if (error instanceof SyntaxError) return Response.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
    console.error(error);
    return Response.json({ message: "로그인을 처리하지 못했습니다." }, { status: 500 });
  }
}
