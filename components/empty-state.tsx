import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  icon?: LucideIcon;
  onAction?: () => void;
  tone?: "light" | "dark";
};

export function EmptyState({
  actionLabel,
  body,
  icon: Icon = Inbox,
  onAction,
  title,
  tone = "light"
}: EmptyStateProps) {
  const dark = tone === "dark";

  return (
    <section
      className={`rounded-2xl border p-5 text-center ${
        dark
          ? "border-white/10 bg-white/[0.04] text-white"
          : "border-[#d7dde8] bg-white text-[#071a33] shadow-[0_8px_24px_rgba(7,18,37,0.04)]"
      }`}
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${
          dark ? "bg-white/10 text-[#c9a84c]" : "bg-[#eef2f8] text-[#8a94a5]"
        }`}
      >
        <Icon size={22} />
      </div>
      <h3 className={`mt-4 text-base font-black ${dark ? "text-white" : "text-[#071a33]"}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-[18rem] text-sm leading-6 ${dark ? "text-white/55" : "text-[#6d7789]"}`}>
        {body}
      </p>
      {actionLabel && onAction && (
        <button
          className={`mt-5 min-h-11 rounded-xl px-5 text-sm font-black ${
            dark ? "bg-[#c9a84c] text-[#071225]" : "bg-[#0f1b2e] text-white"
          }`}
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
