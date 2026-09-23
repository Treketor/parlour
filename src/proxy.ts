import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Everything except build assets, images and the favicon: those never need a session.
  matcher: ["/((?!_next/static|_next/image|icon\\.svg|.*\\.(?:png|jpg|jpeg|webp|svg)$).*)"],
};
