import { AuthStore } from "../src/auth-store.ts";

const globalStore = globalThis as typeof globalThis & { __vynlAuthStore?: AuthStore; __vynlAuthStoreVersion?: number };
const AUTH_STORE_VERSION = 2;

export const authStore = globalStore.__vynlAuthStoreVersion === AUTH_STORE_VERSION
  ? globalStore.__vynlAuthStore ?? new AuthStore()
  : new AuthStore();

if (process.env.NODE_ENV !== "production") {
  globalStore.__vynlAuthStore = authStore;
  globalStore.__vynlAuthStoreVersion = AUTH_STORE_VERSION;
}
