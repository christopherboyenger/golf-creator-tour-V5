import { GctMark } from "@/components/gct-mark";

type TourCardProps = {
  name: string;
  memberNumber: string;
  status: string;
  season?: string;
  variant?: "standard" | "founder";
  compact?: boolean;
};

export function TourCard({
  compact = false,
  memberNumber,
  name,
  season = "2026",
  status,
  variant = "standard"
}: TourCardProps) {
  const founder = variant === "founder";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${
        founder
          ? "border-[#c9a84c]/45 bg-[linear-gradient(135deg,#d9bc59_0%,#9d7923_46%,#f0d878_100%)] text-[#071225]"
          : "border-[#c9a84c]/30 bg-[linear-gradient(135deg,#0f1b2e_0%,#1d2d50_54%,#162340_100%)] text-white"
      } ${compact ? "p-3" : "p-5 shadow-lift"}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-50" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70">
            {founder ? "Founding Member" : "Tour Member"}
          </p>
          <h3 className={`${compact ? "mt-1 text-sm" : "mt-4 text-xl"} font-black`}>{name}</h3>
          <p className={`${compact ? "mt-1 text-[10px]" : "mt-2 text-xs"} font-bold opacity-65`}>{memberNumber}</p>
        </div>
        <GctMark size={compact ? "sm" : "md"} />
      </div>
      {!compact && (
        <div className="relative mt-6 grid grid-cols-3 gap-2">
          {[
            { label: "Status", value: status },
            { label: "Season", value: season },
            { label: "Access", value: founder ? "Elite" : "Standard" }
          ].map((item) => (
            <div
              className={`rounded-xl border px-2 py-2 text-center ${
                founder ? "border-[#071225]/15 bg-[#071225]/10" : "border-white/10 bg-white/[0.04]"
              }`}
              key={item.label}
            >
              <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-55">{item.label}</p>
              <p className="mt-1 text-[11px] font-black">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
