import { DEFAULT_HANDLES, SOCIAL, handleOf, socialHref } from "@/lib/house";
import type { Lang } from "@/lib/i18n";
import { useShop } from "@/lib/shop";

export function SocialLinks({ lang, className }: { lang: Lang; className?: string }) {
  const merchant = useShop((s) => s.merchant);

  return (
    <ul className={className ?? "flex flex-wrap gap-x-5 gap-y-2 text-sm"}>
      {SOCIAL.map((s) => {
        const handle = handleOf(merchant[s.key], DEFAULT_HANDLES[s.key]);
        return (
          <li key={s.id}>
            <a
              href={socialHref(s.id, handle)}
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors duration-quick hover:text-fg"
            >
              {s[lang]}
              <span className="ms-1 text-subtle">@{handle}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
