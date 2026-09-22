import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-[fadeIn_250ms_var(--ease-smooth-out)] data-[state=closed]:animate-[fadeOut_150ms_var(--ease-out)]" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 end-0 z-50 flex h-full w-full max-w-md flex-col bg-surface text-fg shadow-[var(--shadow-border)]",
            "data-[state=open]:animate-[sheetIn_250ms_var(--ease-smooth-out)] data-[state=closed]:animate-[sheetOut_150ms_var(--ease-out)]",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <Dialog.Title className="font-display text-xl text-balance">{title}</Dialog.Title>
            <Dialog.Close className="inline-flex size-11 items-center justify-center rounded-md text-fg transition-transform duration-quick hover:bg-elevated active:scale-[0.96]">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
