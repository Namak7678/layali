const CSS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
const JS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";

export function isMoyasarPk(value: string) {
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(value.trim());
}

type MoyasarApi = {
  init: (config: Record<string, unknown>) => void;
};

function api(): MoyasarApi | undefined {
  return (window as unknown as { Moyasar?: MoyasarApi }).Moyasar;
}

export function loadMoyasar(): Promise<MoyasarApi> {
  const existing = api();
  if (existing) return Promise.resolve(existing);
  if (typeof document === "undefined") return Promise.reject(new Error("browser"));

  if (!document.querySelector(`link[href="${CSS}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const ready = () => {
      const next = api();
      if (next) resolve(next);
      else reject(new Error("moyasar"));
    };
    const prev = document.querySelector(`script[src="${JS}"]`);
    if (prev) {
      prev.addEventListener("load", ready);
      if (api()) ready();
      return;
    }
    const script = document.createElement("script");
    script.src = JS;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("moyasar"));
    document.head.appendChild(script);
  });
}

export function toHalala(sar: number) {
  return Math.max(100, Math.round(sar * 100));
}
