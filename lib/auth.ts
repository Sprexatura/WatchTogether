import { NextRequest } from "next/server";

export function getHostTokenFromRequest(req: NextRequest): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);

  const bodyToken = req.nextUrl.searchParams.get("token");
  if (bodyToken) return bodyToken;

  return null;
}
