import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsSummary, parseDateRange } from "@/lib/data/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const range = parseDateRange(
    searchParams.get("range") ?? "30d",
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined
  );

  const data = await getAnalyticsSummary(session.user.tenantId, range);
  return NextResponse.json(data);
}
