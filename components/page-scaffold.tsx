import type { PageConfig } from "@/lib/page-content";
import { DashboardMockPage } from "@/components/dashboard-mock-pages";
import { GctMark } from "@/components/gct-mark";
import { StatePreviewGrid, SuccessPill } from "@/components/state-preview";

type PlaceholderPageProps = {
  page: PageConfig;
};

export function DashboardPlaceholderPage({ page }: PlaceholderPageProps) {
  return <DashboardMockPage route={page.route} />;
}

export function PublicPlaceholderPage({ page }: PlaceholderPageProps) {
  const Icon = page.icon;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[var(--app-max-w)] flex-col overflow-hidden rounded-[32px] bg-[#0f1b2e] shadow-sheet">
      <section className="px-6 pb-8 pt-10 text-center">
        <GctMark size="lg" />
        <div className="mx-auto mt-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon size={22} strokeWidth={2.3} />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-white/40">{page.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black">{page.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/50">{page.description}</p>
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 divide-x divide-white/10">
          {page.stats.map((stat) => (
            <div className="px-3" key={stat.label}>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="mt-1 text-[11px] font-bold text-white/35">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1 rounded-t-[30px] bg-[#e9eef6] px-4 pb-5 pt-5 text-[#071a33]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9ca6b7]">
              Public route
            </p>
            <h2 className="mt-1 text-lg font-black">{page.route}</h2>
          </div>
          <SuccessPill label="Ready" />
        </div>
        <StatePreviewGrid
          emptyTitle={page.emptyTitle}
          errorTitle={page.errorTitle}
          successTitle={page.successTitle}
        />
      </section>
    </main>
  );
}
