import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveInvoiceDisplayStatus, decimalToNumber } from "@/lib/invoices";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      case: { select: { caseNumber: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const header =
    "Invoice #,Case #,Doctor,Issued,Due,Amount,Status\n";
  const rows = invoices
    .map((inv) => {
      const status = resolveInvoiceDisplayStatus(inv);
      return [
        inv.invoiceNumber,
        inv.case?.caseNumber ?? "",
        `"${inv.doctor.user.name}"`,
        formatDate(inv.issuedAt),
        formatDate(inv.dueDate),
        decimalToNumber(inv.total),
        status,
      ].join(",");
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="invoices.csv"',
    },
  });
}
