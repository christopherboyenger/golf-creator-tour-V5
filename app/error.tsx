"use client";

import { GlobalError } from "@/components/state-preview";

export default function Error({ reset }: { reset: () => void }) {
  return <GlobalError onRetry={reset} />;
}
