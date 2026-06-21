import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontSize: 10, 
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#6366f1",
    paddingBottom: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginVertical: 20,
    color: "#6366f1",
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1e1b4b",
  },
  table: { marginTop: 16 },
  row: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: "#e2e8f0", 
    paddingVertical: 8,
  },
  rowAlt: { backgroundColor: "#f8fafc" },
  th: { 
    fontWeight: "bold", 
    backgroundColor: "#6366f1", 
    color: "#fff", 
    padding: 8,
    fontSize: 9,
  },
  cell: { flex: 1, padding: 8 },
  cellQty: { width: 40, padding: 8, textAlign: "center" },
  cellPrice: { width: 70, padding: 8, textAlign: "right" },
  cellSmall: { width: 50, padding: 8, textAlign: "right" },
  totals: { 
    marginTop: 20, 
    alignItems: "flex-end",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
  },
  totalBig: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginTop: 8,
    color: "#6366f1",
  },
  footer: { 
    position: "absolute", 
    bottom: 40, 
    left: 40, 
    right: 40, 
    textAlign: "center", 
    color: "#64748b",
    fontSize: 9,
  },
  bankDetails: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  amountInWords: {
    marginTop: 12,
    fontStyle: "italic",
    color: "#475569",
  },
});

export type InvoicePdfData = {
  labName: string;
  labAddress?: string | null;
  gstNumber?: string | null;
  logoUrl?: string | null;
  invoiceNumber: string;
  issuedAt: string;
  dueDate?: string | null;
  doctorName: string;
  clinicName: string;
  doctorAddress?: string | null;
  items: { 
    description: string; 
    qty: number; 
    unitPrice: number; 
    total: number;
    gstPercent?: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  amountInWords?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
};

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const cgst = data.tax / 2;
  const sgst = data.tax / 2;
  const igst = data.tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {data.logoUrl ? (
              <Image src={data.logoUrl} style={{ width: 100, height: 50 }} /> // eslint-disable-line jsx-a11y/alt-text
            ) : (
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: "#6366f1", 
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 8,
              }}>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                  {data.labName.charAt(0)}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1e1b4b" }}>{data.labName}</Text>
            {data.labAddress ? <Text style={{ color: "#64748b", fontSize: 9 }}>{data.labAddress}</Text> : null}
            {data.gstNumber ? <Text style={{ color: "#64748b", fontSize: 9 }}>GSTIN: {data.gstNumber}</Text> : null}
          </View>
          <View style={{ textAlign: "right", flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#6366f1" }}>TAX INVOICE</Text>
            <Text style={{ marginTop: 4, color: "#475569" }}>Invoice #: {data.invoiceNumber}</Text>
            <Text style={{ color: "#475569" }}>Issued: {data.issuedAt}</Text>
            {data.dueDate ? <Text style={{ color: "#475569" }}>Due: {data.dueDate}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#1e1b4b" }}>{data.doctorName}</Text>
          <Text style={{ color: "#64748b" }}>{data.clinicName}</Text>
          {data.doctorAddress ? <Text style={{ color: "#64748b", fontSize: 9 }}>{data.doctorAddress}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.th]}>
            <Text style={[styles.cell, { flex: 2 }]}>Description</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Rate (₹)</Text>
            {data.tax > 0 && (
              <>
                <Text style={styles.cellSmall}>GST%</Text>
                <Text style={styles.cellSmall}>CGST (₹)</Text>
                <Text style={styles.cellSmall}>SGST (₹)</Text>
              </>
            )}
            <Text style={styles.cellPrice}>Total (₹)</Text>
          </View>
          {data.items.map((item, i) => {
            const itemGst = data.tax > 0 ? (item.gstPercent || 18) : 0;
            const itemCgst = (item.total * (itemGst / 100)) / 2;
            const itemSgst = (item.total * (itemGst / 100)) / 2;
            return (
              <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
                <Text style={[styles.cell, { flex: 2 }]}>{item.description}</Text>
                <Text style={styles.cellQty}>{item.qty}</Text>
                <Text style={styles.cellPrice}>{item.unitPrice.toFixed(2)}</Text>
                {data.tax > 0 && (
                  <>
                    <Text style={styles.cellSmall}>{itemGst}%</Text>
                    <Text style={styles.cellSmall}>{itemCgst.toFixed(2)}</Text>
                    <Text style={styles.cellSmall}>{itemSgst.toFixed(2)}</Text>
                  </>
                )}
                <Text style={styles.cellPrice}>{item.total.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.amountInWords}>
          <Text style={{ fontSize: 9, fontWeight: "bold" }}>Amount in Words: </Text>
          <Text style={{ fontSize: 9 }}>{data.amountInWords || "Rupees Zero Only"}</Text>
        </View>

        <View style={styles.totals}>
          <Text style={{ fontSize: 11 }}>Subtotal: ₹{data.subtotal.toFixed(2)}</Text>
          {data.tax > 0 && (
            <>
              <Text style={{ fontSize: 11 }}>CGST (9%): ₹{cgst.toFixed(2)}</Text>
              <Text style={{ fontSize: 11 }}>SGST (9%): ₹{sgst.toFixed(2)}</Text>
            </>
          )}
          <Text style={styles.totalBig}>Grand Total: ₹{data.total.toFixed(2)}</Text>
        </View>

        {data.bankDetails && (
          <View style={styles.bankDetails}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            {data.bankDetails.bankName && <Text style={{ fontSize: 9, color: "#475569" }}>Bank: {data.bankDetails.bankName}</Text>}
            {data.bankDetails.accountNumber && <Text style={{ fontSize: 9, color: "#475569" }}>Account No: {data.bankDetails.accountNumber}</Text>}
            {data.bankDetails.ifscCode && <Text style={{ fontSize: 9, color: "#475569" }}>IFSC Code: {data.bankDetails.ifscCode}</Text>}
            {data.bankDetails.branch && <Text style={{ fontSize: 9, color: "#475569" }}>Branch: {data.bankDetails.branch}</Text>}
          </View>
        )}

        <View style={{ marginTop: 16, padding: 12, backgroundColor: "#fef3c7", borderRadius: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: "bold", color: "#92400e" }}>Payment Terms</Text>
          <Text style={{ fontSize: 9, color: "#92400e", marginTop: 4 }}>
            Payment is due within 30 days from the invoice date. Late payments may attract interest at 18% per annum.
          </Text>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated invoice. For any queries, please contact {data.labName} · Thank you for your business!
        </Text>
      </Page>
    </Document>
  );
}
