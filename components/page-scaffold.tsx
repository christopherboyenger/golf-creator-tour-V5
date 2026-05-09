import type { PageConfig } from "@/lib/page-content";
import { GctMark } from "@/components/gct-mark";
import { StatePreviewGrid, SuccessPill } from "@/components/state-preview";

type PlaceholderPageProps = {
  page: PageConfig;
};

export function DashboardPlaceholderPage({ page }: PlaceholderPageProps) {
  const Icon = page.icon;

  return (
    <>
      <section className="px-6 pb-9 pt-4 text-center text-white">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon size={22} strokeWidth={2.3} />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-white/40">{page.title}</p>
        <h1 className="mt-3 text-2xl font-black tracking-normal">{page.eyebrow}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">{page.description}</p>
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 divide-x divide-white/12">
          {page.stats.map((stat) => (
            <div className="px-3" key={stat.label}>
              <div className="text-3xl font-black text-white first:text-[#c9a84c]">{stat.value}</div>
              <div className="mt-1 text-xs font-bold text-white/35">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-[52vh] rounded-t-[30px] bg-[#e9eef6] px-4 pb-28 pt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9ca6b7]">
              Route placeholder
            </p>
            <h2 className="mt-1 text-lg font-black text-[#071a33]">{page.route}</h2>
          </div>
          <SuccessPill label="Ready" />
        </div>

        <div className="rounded-2xl border border-[#d6dce7] bg-white p-4 shadow-[0_8px_24px_rgba(7,18,37,0.05)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#0f1b2e]" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-[#071a33]">Mock content surface</h3>
              <p className="mt-1 text-xs leading-5 text-[#7b8596]">
                This route is reserved for the intended GCT page rebuild after the shell is stable.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <StatePreviewGrid
            emptyTitle={page.emptyTitle}
            errorTitle={page.errorTitle}
            successTitle={page.successTitle}
          />
        </div>
      </section>
    </>
  );
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
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 divide-x divide-white/12">
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
