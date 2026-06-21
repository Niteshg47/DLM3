"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CasesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CasesError boundary]", error);
  }, [error]);

  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center mt-8">
      <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
      <p className="text-sm text-red-600 mb-4">
        The cases page encountered an error. Please try again.
      </p>
      <Button
        variant="outline"
        onClick={reset}
        className="border-red-300 text-red-700 hover:bg-red-100"
      >
        Try again
      </Button>
    </div>
  );
}
