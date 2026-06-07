import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getInvoiceById } from "@/lib/data/invoices";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await getInvoiceById(session.user.tenantId, id);

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      data={{
        labName: invoice.tenant.name,
        labAddress: invoice.tenant.address,
        gstNumber: invoice.tenant.gstNumber,
        logoUrl: invoice.tenant.logoUrl,
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: formatDate(invoice.issuedAt),
        dueDate: formatDate(invoice.dueDate),
        doctorName: invoice.doctor.user.name,
        clinicName: invoice.doctor.clinicName,
        items: invoice.items.map((i) => ({
          description: i.description,
          qty: i.qty,
          unitPrice: i.unitPriceNum,
          total: i.totalNum,
        })),
        subtotal: invoice.subtotalNum,
        tax: invoice.taxNum,
        total: invoice.totalNum,
      }}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
