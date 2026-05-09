import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen px-4 py-6 text-white">{children}</div>;
}
