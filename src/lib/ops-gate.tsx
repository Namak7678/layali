import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { verifyOpsPasscode } from "@/lib/ops-server";
import { useShop } from "@/lib/shop";

const STORAGE_KEY = "layali_ops_passcode";

export function getStoredOpsAuth(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setStoredOpsAuth(value: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable — user re-enters the code each visit */
  }
}

export function clearStoredOpsAuth() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** True when a server call failed because the ops passcode was missing/wrong. */
export function opsDenied(error: unknown): boolean {
  return String(error).includes("ops_access_denied");
}

export function opsPasscodeNotConfigured(error: unknown): boolean {
  return String(error).includes("ops_passcode_not_configured");
}

export function OpsGate({ onPass }: { onPass: (auth: string) => void }) {
  const lang = useShop((s) => s.lang);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const auth = value.trim();
    if (!auth || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await verifyOpsPasscode({ data: { auth } });
      if (res.ok) {
        setStoredOpsAuth(auth);
        onPass(auth);
      } else if (res.reason === "not_configured") {
        setError(t(lang, "opsGateMissing"));
      } else {
        setError(t(lang, "opsGateBad"));
      }
    } catch {
      setError(t(lang, "opsGateOffline"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-xs tracking-[0.28em] text-muted">{t(lang, "opsKicker")}</p>
      <h1 className="mt-2 font-display text-3xl">{t(lang, "opsGateTitle")}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{t(lang, "opsGateBody")}</p>
      <form className="mt-8 flex gap-3" onSubmit={submit}>
        <Input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="••••••••"
          autoFocus
          autoComplete="current-password"
        />
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? "…" : t(lang, "opsGateUnlock")}
        </Button>
      </form>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
