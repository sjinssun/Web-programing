import { authStore } from "../../../../lib/auth-store-instance.ts";
import { expiredSessionCookie, readSessionToken } from "../../../../src/auth-store.ts";

export async function DELETE(request: Request) {
  authStore.logout(readSessionToken(request));
  return Response.json({ ok: true }, { headers: { "set-cookie": expiredSessionCookie() } });
}
