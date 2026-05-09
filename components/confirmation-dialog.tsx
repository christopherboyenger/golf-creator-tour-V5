"use client";

import { AlertTriangle } from "lucide-react";
import { ModalSheet } from "@/components/modal-sheet";

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  body,
  cancelLabel = "Cancel",
  confirmLabel,
  destructive = false,
  isOpen,
  onCancel,
  onConfirm,
  title
}: ConfirmationDialogProps) {
  return (
    <ModalSheet isOpen={isOpen} onClose={onCancel} showHandle={false} tone="light" variant="dialog">
      <div className="text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${
            destructive ? "bg-red-50 text-red-500" : "bg-[#f7efd1] text-[#9b7a20]"
          }`}
        >
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black text-[#071a33]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6d7789]">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="min-h-11 rounded-xl border border-[#d7dde8] bg-white text-sm font-black text-[#6d7789]"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`min-h-11 rounded-xl text-sm font-black ${
              destructive ? "bg-red-500 text-white" : "bg-[#0f1b2e] text-white"
            }`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
