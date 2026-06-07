"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses = [
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
  "INVOICED",
] as const;

export function CaseFilters({
  doctors,
}: {
  doctors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/cases?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search case # or patient..."
        className="max-w-xs"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
          (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
            () => update("search", v),
            400
          );
        }}
      />
      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(v) => update("status", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("doctorId") ?? ""}
        onValueChange={(v) => update("doctorId", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Doctor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All doctors</SelectItem>
          {doctors.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
