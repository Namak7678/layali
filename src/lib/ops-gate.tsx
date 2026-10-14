import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOpsPasscode } from "@/lib/ops-server";

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
        setError(
          "رمز الحماية غير مضبوط على السيرفر — اضبط OPS_PASSCODE ثم أعد المحاولة / Access code not configured on the server (set OPS_PASSCODE)",
        );
      } else {
        setError("رمز غير صحيح / Wrong code");
      }
    } catch {
      setError("تعذر الاتصال بالسيرفر / Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-xs tracking-[0.28em] text-muted">LAYALI OPS</p>
      <h1 className="mt-2 font-display text-3xl">رمز الدخول</h1>
      <p className="mt-2 text-xs text-muted">Access code</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        هـذه الصفحة إدارية ومحمية. / This page is admin-only and protected.
      </p>
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
          {busy ? "..." : "دخول / Unlock"}
        </Button>
      </form>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
