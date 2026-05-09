import Link from "next/link";
import { GctMark } from "@/components/gct-mark";

export default function NotFound() {
  return (
    <main className="min-h-screen px-5 py-10 text-white">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-[var(--app-max-w)] flex-col items-center justify-center rounded-[28px] bg-[#0f1b2e] p-8 text-center shadow-sheet">
        <GctMark size="lg" />
        <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-white/45">Route not found</p>
        <h1 className="mt-3 text-3xl font-black">This page is not on the tour card.</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
          The required GCT routes are scaffolded. This address does not match one of them.
        </p>
        <Link
          className="mt-8 rounded-xl bg-[#c9a84c] px-5 py-3 text-sm font-black text-[#071225] no-underline"
          href="/profile"
        >
          Back to Profile
        </Link>
      </section>
    </main>
  );
}
