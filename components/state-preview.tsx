import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";

type StatePreviewProps = {
  emptyTitle: string;
  errorTitle: string;
  successTitle: string;
};

export function StatePreviewGrid({ emptyTitle, errorTitle, successTitle }: StatePreviewProps) {
  const states = [
    {
      label: "Loading",
      title: "Loading tour data",
      description: "Skeleton blocks hold the layout while route data resolves.",
      icon: Loader2,
      tone: "text-blue-500",
      className: "animate-[gctSpin_1s_linear_infinite]"
    },
    {
      label: "Empty",
      title: emptyTitle,
      description: "The route keeps its shape when there is nothing to show.",
      icon: Inbox,
      tone: "text-slate-500",
      className: ""
    },
    {
      label: "Error",
      title: errorTitle,
      description: "Retry and recovery actions have a reserved home.",
      icon: AlertTriangle,
      tone: "text-red-500",
      className: ""
    },
    {
      label: "Success",
      title: successTitle,
      description: "The stable state is ready for page-specific work.",
      icon: CheckCircle2,
      tone: "text-emerald-500",
      className: ""
    }
  ];

  return (
    <div className="grid gap-3">
      {states.map((state) => {
        const Icon = state.icon;
        return (
          <article
            className="flex min-h-[92px] items-center gap-3 rounded-2xl border border-[#d6dce7] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(7,18,37,0.05)]"
            key={state.label}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2f8]">
              <Icon className={`${state.tone} ${state.className}`} size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">
                {state.label}
              </p>
              <h3 className="mt-1 text-sm font-black text-[#0b1a31]">{state.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#7b8596]">{state.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="px-5 pb-28 pt-10">
      <div className="mx-auto h-20 w-20 rounded-3xl bg-white/5" />
      <div className="mt-10 rounded-[28px] bg-[#e9eef6] p-5">
        <div className="h-8 w-2/3 rounded-xl bg-[#dce3ef]" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div className="h-20 overflow-hidden rounded-2xl bg-white" key={item}>
              <div className="h-full w-full animate-[gctShimmer_1.25s_ease_infinite] bg-[linear-gradient(90deg,transparent,rgba(15,27,46,0.06),transparent)] bg-[length:180%_100%]" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-20 overflow-hidden rounded-2xl bg-white" key={item}>
              <div className="h-full w-full animate-[gctShimmer_1.25s_ease_infinite] bg-[linear-gradient(90deg,transparent,rgba(15,27,46,0.06),transparent)] bg-[length:180%_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GlobalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-white">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
        <Loader2 className="mx-auto animate-[gctSpin_1s_linear_infinite] text-[#c9a84c]" size={32} />
        <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-white/55">
          Loading Golf Creator Tour
        </p>
      </div>
    </main>
  );
}

export function GlobalError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-white">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
        <AlertTriangle className="mx-auto text-red-300" size={34} />
        <h1 className="mt-4 text-2xl font-black">Something slipped offline.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          The scaffold has a reserved recovery state for production errors.
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c9a84c] px-5 py-3 text-sm font-black text-[#071225]"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    </main>
  );
}

export function SuccessPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
      <Sparkles size={13} />
      {label}
    </span>
  );
}
