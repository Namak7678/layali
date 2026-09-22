import { useEffect, useRef } from "react";
import { loadMoyasar, toHalala } from "@/lib/moyasar";

export function MadaForm({
  amountSar,
  orderId,
  publishableKey,
  onPaid,
  onFail,
}: {
  amountSar: number;
  orderId: string;
  publishableKey: string;
  onPaid: (paymentId: string) => void;
  onFail: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const once = useRef(false);

  useEffect(() => {
    if (!box.current || once.current) return;
    once.current = true;
    const origin = window.location.origin;
    void loadMoyasar()
      .then((Moyasar) => {
        Moyasar.init({
          element: ".mysr-form",
          amount: toHalala(amountSar),
          currency: "SAR",
          description: `LAYALI ${orderId}`,
          publishable_api_key: publishableKey,
          callback_url: `${origin}/pay?order=${encodeURIComponent(orderId)}`,
          supported_networks: ["mada", "visa", "mastercard"],
          methods: ["creditcard"],
          metadata: { order_id: orderId },
          on_completed: async (payment: { id?: string; status?: string }) => {
            if (payment.status === "paid" && payment.id) onPaid(payment.id);
            else if (payment.status === "failed") onFail();
          },
        });
      })
      .catch(() => onFail());
  }, [amountSar, orderId, publishableKey, onFail, onPaid]);

  return <div ref={box} className="mysr-form min-h-48 rounded-2xl bg-accent p-4 text-accent-fg" />;
}
