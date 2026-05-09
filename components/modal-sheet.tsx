"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalSheetVariant = "bottom" | "full" | "dialog";
type ModalSheetTone = "dark" | "light";

type ModalSheetProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  footer?: ReactNode;
  variant?: ModalSheetVariant;
  tone?: ModalSheetTone;
  closeLabel?: string;
  showHandle?: boolean;
  showHeader?: boolean;
};

const variantClass: Record<ModalSheetVariant, string> = {
  bottom:
    "gct-fixed fixed bottom-0 z-[80] max-h-[92vh] overflow-y-auto rounded-t-[24px] shadow-sheet animate-[gctSheetUp_0.32s_cubic-bezier(0.16,1,0.3,1)_both]",
  full: "gct-fixed fixed inset-y-0 z-[80] overflow-y-auto shadow-sheet animate-[gctSlideIn_0.24s_ease_both]",
  dialog:
    "fixed left-1/2 top-1/2 z-[90] w-[calc(100%-40px)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-sheet animate-[gctFadeUp_0.22s_ease_both]"
};

const toneClass: Record<ModalSheetTone, string> = {
  dark: "border border-white/10 bg-[#0f1b2e] text-white",
  light: "border border-[#d7dde8] bg-white text-[#071a33]"
};

export function ModalSheet({
  children,
  closeLabel = "Close",
  eyebrow,
  footer,
  isOpen,
  onClose,
  showHandle = true,
  showHeader = true,
  title,
  tone = "dark",
  variant = "bottom"
}: ModalSheetProps) {
  if (!isOpen) {
    return null;
  }

  const isDialog = variant === "dialog";
  const isDark = tone === "dark";

  return (
    <>
      <button
        aria-label={closeLabel}
        className={`gct-fixed fixed inset-y-0 z-[70] ${
          isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/35"
        }`}
        onClick={onClose}
        type="button"
      />
      <section className={`${variantClass[variant]} ${toneClass[tone]}`}>
        {showHandle && variant === "bottom" && (
          <div className="flex justify-center px-4 pt-3">
            <span className={`h-1 w-10 rounded-full ${isDark ? "bg-white/20" : "bg-[#cdd4df]"}`} />
          </div>
        )}

        {showHeader && (title || eyebrow || !isDialog) && (
          <header
            className={`flex items-start justify-between gap-4 ${
              variant === "dialog" ? "px-5 pb-2 pt-5" : "px-5 pb-4 pt-5"
            }`}
          >
            <div className="min-w-0">
              {eyebrow && (
                <p
                  className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                    isDark ? "text-[#c9a84c]" : "text-[#9aa4b5]"
                  }`}
                >
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className={`mt-1 text-xl font-black ${isDark ? "text-white" : "text-[#071a33]"}`}>
                  {title}
                </h2>
              )}
            </div>
            <button
              aria-label={closeLabel}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isDark ? "bg-white/10 text-white/70" : "bg-[#e3e8f1] text-[#7c8798]"
              }`}
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </header>
        )}

        <div className={variant === "dialog" ? "px-5 pb-5" : "px-5 pb-6"}>{children}</div>
        {footer && <footer className="border-t border-current/10 px-5 py-4">{footer}</footer>}
      </section>
    </>
  );
}
