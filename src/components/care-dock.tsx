import { useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { CareDesk } from "@/components/care-desk";
import { Sheet } from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { useShop } from "@/lib/shop";

export function CareDock() {
  const lang = useShop((s) => s.lang);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (path.startsWith("/ops") || path.startsWith("/setup") || path.startsWith("/pay")) return null;

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 start-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-4 text-sm text-accent-fg shadow-[var(--shadow-border)]"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="size-4" />
        {t(lang, "care")}
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={t(lang, "careTitle")}>
        <p className="mb-5 text-sm text-muted">{t(lang, "careHours")}</p>
        <CareDesk />
      </Sheet>
    </>
  );
}
