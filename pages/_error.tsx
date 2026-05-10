import type { NextPageContext } from "next";
import { GctMark } from "@/components/gct-mark";

type ErrorPageProps = {
  statusCode: number;
};

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-[#071225] px-5 py-10 text-white">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-[var(--app-max-w)] flex-col items-center justify-center rounded-[28px] bg-[#0f1b2e] p-8 text-center shadow-sheet">
        <GctMark size="lg" />
        <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-white/45">
          Tour app error
        </p>
        <h1 className="mt-3 text-3xl font-black">Something went off course.</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
          {statusCode >= 500
            ? "The GCT app could not finish this request."
            : "This route could not be loaded."}
        </p>
      </section>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res?.statusCode ?? (err as { statusCode?: number } | undefined)?.statusCode ?? 404;

  return { statusCode };
};
