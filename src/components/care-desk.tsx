import { useEffect, useRef, useState } from "react";
import { answerCare, careChips } from "@/lib/care";
import { t, type Lang } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { waHref } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "house" | "user"; text: string };

export function CareDesk() {
  const lang = useShop((s) => s.lang);
  const whatsapp = useShop((s) => s.merchant.whatsapp);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => welcome(lang));
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(welcome(lang));
  }, [lang]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMsgs((prev) => [...prev, { role: "user", text: trimmed }, { role: "house", text: answerCare(trimmed, lang) }]);
    setQ("");
  }

  const wa = waHref(
    whatsapp,
    lang === "ar" ? "مرحبا، سؤال لخدمة عملاء لَيَالِي" : "Hello, a question for LAYALI care",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="space-y-3">
        {msgs.map((m, i) => (
          <li
            key={`${m.role}-${i}`}
            className={
              m.role === "house"
                ? "max-w-[92%] rounded-2xl bg-elevated px-4 py-3 text-sm leading-relaxed"
                : "ms-auto max-w-[92%] rounded-2xl bg-accent px-4 py-3 text-sm leading-relaxed text-accent-fg"
            }
          >
            {m.text}
          </li>
        ))}
      </ul>
      <div ref={end} />

      <div className="mt-4 flex flex-wrap gap-2">
        {careChips.map((c) => (
          <button
            key={c.en}
            type="button"
            className="h-9 rounded-full bg-elevated px-3 text-xs text-muted hover:text-fg"
            onClick={() => send(c[lang])}
          >
            {c[lang]}
          </button>
        ))}
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
      >
        <Textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder={t(lang, "careAsk")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(q);
            }
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="flex-1">
            {t(lang, "careSend")}
          </Button>
          <Button asChild type="button" variant="outline" className="flex-1">
            <a href={wa} target="_blank" rel="noreferrer">
              {t(lang, "careWa")}
            </a>
          </Button>
        </div>
      </form>
    </div>
  );
}

function welcome(lang: Lang): Msg[] {
  return [{ role: "house", text: t(lang, "careWelcome") }];
}
