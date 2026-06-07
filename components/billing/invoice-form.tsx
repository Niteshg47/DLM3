"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvoiceAction, updateInvoiceAction } from "@/app/actions/invoices";
import { formatCurrency } from "@/lib/utils";
import type { LineItemInput } from "@/lib/validations/invoice";

type Props = {
  doctors: { id: string; name: string }[];
  defaultDoctorId?: string;
  defaultCaseId?: string;
  prefilledItems?: LineItemInput[];
  defaultIssuedAt?: string;
  defaultDueDate?: string;
  invoiceId?: string;
  readOnly?: boolean;
};

export function InvoiceForm({
  doctors,
  defaultDoctorId = "",
  defaultCaseId = "",
  prefilledItems,
  defaultIssuedAt,
  defaultDueDate,
  invoiceId,
  readOnly,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [doctorId, setDoctorId] = useState(defaultDoctorId);
  const [applyGst, setApplyGst] = useState(true);
  const [items, setItems] = useState<LineItemInput[]>(
    prefilledItems ?? [{ description: "", qty: 1, unitPrice: 0 }]
  );

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax = applyGst ? subtotal * 0.18 : 0;
  const total = subtotal + tax;

  function updateItem(index: number, field: keyof LineItemInput, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0 }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function submit(sendNow: boolean) {
    const fd = new FormData();
    fd.set("doctorId", doctorId);
    if (defaultCaseId) fd.set("caseId", defaultCaseId);
    fd.set("issuedAt", defaultIssuedAt ?? new Date().toISOString().slice(0, 10));
    fd.set("dueDate", defaultDueDate ?? "");
    fd.set("applyGst", String(applyGst));
    fd.set("sendNow", String(sendNow));
    fd.set("items", JSON.stringify(items));

    startTransition(async () => {
      if (invoiceId) {
        await updateInvoiceAction(invoiceId, fd);
        router.refresh();
      } else {
        await createInvoiceAction(fd);
      }
    });
  }

  return (
    <div className="space-y-6 rounded-xl bg-white p-6 shadow-card">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doctorId">Doctor</Label>
          <select
            id="doctorId"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={readOnly}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {defaultCaseId && (
          <input type="hidden" name="caseId" value={defaultCaseId} />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Line items</Label>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Add row
            </Button>
          )}
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-purple/10">
              <tr>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 w-20">Qty</th>
                <th className="text-left p-2 w-28">Unit price</th>
                <th className="text-right p-2 w-28">Total</th>
                {!readOnly && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? "bg-brand-canvas" : ""}>
                  <td className="p-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(i, "qty", parseInt(e.target.value, 10) || 1)}
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      disabled={readOnly}
                    />
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(item.qty * item.unitPrice)}
                  </td>
                  {!readOnly && (
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-rose-500 hover:text-rose-700"
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={applyGst}
            onChange={(e) => setApplyGst(e.target.checked)}
            disabled={readOnly}
            className="rounded border-slate-300"
          />
          Apply GST 18% (CGST 9% + SGST 9%)
        </label>
        <div className="text-sm space-y-1 sm:text-right">
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          {applyGst && (
            <>
              <p className="text-muted-foreground">CGST (9%): {formatCurrency(tax / 2)}</p>
              <p className="text-muted-foreground">SGST (9%): {formatCurrency(tax / 2)}</p>
            </>
          )}
          <p className="text-lg font-bold text-brand-purple">Total: {formatCurrency(total)}</p>
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => submit(false)}
          >
            Save as draft
          </Button>
          <Button
            type="button"
            className="bg-brand-purple hover:bg-purple-600"
            disabled={pending}
            onClick={() => submit(true)}
          >
            Save & send
          </Button>
        </div>
      )}
    </div>
  );
}
