"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/** Bottom sheet on top of a native modal <dialog>. Children mount only while open. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop targets the dialog itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-t border-line bg-surface text-ink backdrop:bg-black/60"
    >
      {open && (
        <div className="flex flex-col gap-5 px-6 pt-5 pb-[max(env(safe-area-inset-bottom),24px)]">
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-[22px] font-bold tracking-[-0.4px]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Zavřít"
              className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-muted"
            >
              <CloseIcon size={22} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
