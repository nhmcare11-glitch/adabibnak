// lib/payment-utils.ts

export function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "💵 نقدي",
    CARD: "💳 PayPal / بطاقة",
    FREE: "🆓 مجاني",
    DEFERRED: "⏳ مؤجل",
  };
  return labels[method] || method;
}