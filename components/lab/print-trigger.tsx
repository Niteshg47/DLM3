"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      className="no-print mb-4 text-sm underline"
      onClick={() => window.print()}
    >
      Print again
    </button>
  );
}
