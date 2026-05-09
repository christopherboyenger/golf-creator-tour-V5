type LoadingSkeletonProps = {
  rows?: number;
  compact?: boolean;
  tone?: "light" | "dark";
};

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-current/10 ${className}`}>
      <div className="h-full w-full animate-[gctShimmer_1.25s_ease_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] bg-[length:180%_100%]" />
    </div>
  );
}

export function LoadingSkeleton({ compact = false, rows = 3, tone = "light" }: LoadingSkeletonProps) {
  const dark = tone === "dark";

  return (
    <section
      className={`rounded-2xl border p-4 ${
        dark ? "border-white/10 bg-white/[0.04] text-white" : "border-[#d7dde8] bg-white text-[#9aa4b5]"
      }`}
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="mt-3 h-3 w-1/2" />
        </div>
      </div>
      {!compact && (
        <div className="mt-4 grid gap-3">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonBlock className="h-16" key={index} />
          ))}
        </div>
      )}
    </section>
  );
}
