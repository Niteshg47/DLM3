"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Authentication error</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
