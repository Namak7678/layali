import { t, type Lang } from "@/lib/i18n";

/** Public transfer instructions. Numbers stay LTR so IBAN digits do not reorder. */
export function PaymentRails({
  lang,
  stcPay,
  iban,
}: {
  lang: Lang;
  stcPay: string;
  iban: string;
}) {
  const hasNumber = Boolean(stcPay || iban);
  return (
    <div className="rounded-2xl bg-elevated p-4 text-start">
      <p className="text-sm font-medium">{t(lang, "railsTitle")}</p>
      <p className="mt-2 text-sm leading-7 text-muted">{t(lang, "giftPayHint")}</p>
      {hasNumber ? (
        <dl className="mt-3 space-y-3 text-sm">
          {stcPay ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted">{t(lang, "stcPay")}</dt>
              <dd dir="ltr" className="min-w-0 break-all text-end tabular-nums">
                {stcPay}
              </dd>
            </div>
          ) : null}
          {iban ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-muted">{t(lang, "iban")}</dt>
              <dd dir="ltr" className="min-w-0 break-all text-end tabular-nums">
                {iban}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">{t(lang, "railsMissing")}</p>
      )}
    </div>
  );
}
