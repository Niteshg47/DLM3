import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getInvoiceById } from "@/lib/data/invoices";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import { formatDate } from "@/lib/utils";
import { numberToWords } from "@/lib/number-to-words";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(session.user.tenantId, id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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
          doctorAddress: invoice.doctor.address,
          items: invoice.items.map((i) => ({
            description: i.description,
            qty: i.qty,
            unitPrice: i.unitPriceNum,
            total: i.totalNum,
            gstPercent: 18,
          })),
          subtotal: invoice.subtotalNum,
          tax: invoice.taxNum,
          total: invoice.totalNum,
          amountInWords: numberToWords(invoice.totalNum),
          bankDetails: {
            bankName: "HDFC Bank",
            accountNumber: "123456789012",
            ifscCode: "HDFC0001234",
            branch: "Main Branch",
          },
        }}
      />
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[InvoicePdfRoute] failed to generate PDF:", err);
    return NextResponse.json(
      {
        error: "Could not generate the invoice PDF right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
