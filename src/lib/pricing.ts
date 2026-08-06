export type LevelCode = string;

export function discountedPrice(listPrice: number, discountPct: number) {
  return Math.round(listPrice * (1 - discountPct / 100) * 100) / 100;
}

export function quoteTotals(
  items: Array<{ list_price: number; unit_price: number; quantity: number }>,
) {
  const subtotalList = items.reduce((s, i) => s + i.list_price * i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  return {
    subtotal_list: Math.round(subtotalList * 100) / 100,
    total: Math.round(total * 100) / 100,
    discount_amount: Math.round((subtotalList - total) * 100) / 100,
  };
}

export const STOCK_LABEL: Record<string, string> = {
  available: "Disponible",
  low: "Bajo inventario",
  inquire: "Consultar disponibilidad",
  out: "Agotado",
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending: "Enviada",
  in_review: "En revisión",
  approved: "Aprobada",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  received: "Recibido",
  in_review: "En revisión",
  availability_confirmed: "Disponibilidad confirmada",
  approved: "Aprobado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export const ORDER_FLOW = [
  "received",
  "in_review",
  "availability_confirmed",
  "approved",
  "preparing",
  "shipped",
  "delivered",
] as const;
