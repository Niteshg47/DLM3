import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 16 },
  table: { marginTop: 16 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingVertical: 6 },
  rowAlt: { backgroundColor: "#f8fafc" },
  th: { fontWeight: "bold", backgroundColor: "#6366f1", color: "#fff", padding: 6 },
  cell: { flex: 1, padding: 6 },
  cellQty: { width: 40, padding: 6 },
  cellPrice: { width: 80, padding: 6, textAlign: "right" },
  totals: { marginTop: 20, alignItems: "flex-end" },
  totalBig: { fontSize: 14, fontWeight: "bold", marginTop: 8 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", color: "#64748b" },
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
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
};

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const cgst = data.tax / 2;
  const sgst = data.tax / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {data.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoUrl} style={{ width: 80, height: 40 }} />
            ) : null}
            <Text style={{ fontSize: 14, fontWeight: "bold", marginTop: 8 }}>{data.labName}</Text>
            {data.labAddress ? <Text>{data.labAddress}</Text> : null}
            {data.gstNumber ? <Text>GSTIN: {data.gstNumber}</Text> : null}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text>Invoice #: {data.invoiceNumber}</Text>
            <Text>Issued: {data.issuedAt}</Text>
            {data.dueDate ? <Text>Due: {data.dueDate}</Text> : null}
          </View>
        </View>

        <Text style={styles.title}>TAX INVOICE</Text>

        <View>
          <Text style={{ fontWeight: "bold" }}>Bill To</Text>
          <Text>{data.doctorName}</Text>
          <Text>{data.clinicName}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.th]}>
            <Text style={[styles.cell, { flex: 2 }]}>Description</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Rate</Text>
            <Text style={styles.cellPrice}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <Text style={[styles.cell, { flex: 2 }]}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.qty}</Text>
              <Text style={styles.cellPrice}>₹{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.cellPrice}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text>Subtotal: ₹{data.subtotal.toFixed(2)}</Text>
          {data.tax > 0 && (
            <>
              <Text>CGST (9%): ₹{cgst.toFixed(2)}</Text>
              <Text>SGST (9%): ₹{sgst.toFixed(2)}</Text>
            </>
          )}
          <Text style={styles.totalBig}>Total: ₹{data.total.toFixed(2)}</Text>
        </View>

        <Text style={styles.footer}>
          Thank you for your business · {data.labName}
        </Text>
      </Page>
    </Document>
  );
}
