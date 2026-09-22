import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { toHalala } from "@/lib/moyasar";
import { confirmMadaPayment, listOrders } from "@/lib/ops-server";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/pay")({ component: PayReturn });

function PayReturn() {
  const lang = useShop((s) => s.lang);
  const [state, setState] = useState<"wait" | "ok" | "fail">("wait");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const order = q.get("order") ?? "";
    const paymentId = q.get("id") ?? "";
    setOrderId(order);
    if (!order || !paymentId) {
      setState("fail");
      return;
    }
    void (async () => {
      try {
        const orders = await listOrders();
        const found = orders.find((o) => o.id === order);
        if (!found) {
          setState("fail");
          return;
        }
        const res = await confirmMadaPayment({
          data: { orderId: order, paymentId, amount: toHalala(found.total) },
        });
        setState(res.ok ? "ok" : "fail");
      } catch {
        setState("fail");
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs tracking-[0.28em] text-muted">{orderId || "LAYALI"}</p>
      <h1 className="mt-3 font-display text-4xl">
        {state === "wait" ? "…" : state === "ok" ? t(lang, "paySuccess") : t(lang, "payFailed")}
      </h1>
      <p className="mt-4 text-muted">{state === "ok" ? t(lang, "payMadaBody") : t(lang, "thanksBody")}</p>
      <div className="mt-8 flex flex-col gap-3">
        <Button asChild>
          <Link to="/ops">{t(lang, "openOps")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/shop">{t(lang, "continue")}</Link>
        </Button>
      </div>
    </div>
  );
}
