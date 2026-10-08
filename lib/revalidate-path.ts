import { revalidatePath } from "next/cache.js";

export function revalidateAppPath(path: string, type?: "layout" | "page") {
  try {
    revalidatePath(path, type);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("static generation store missing")) return;
    throw error;
  }
}
