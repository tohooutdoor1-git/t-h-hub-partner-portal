export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function money2(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "short" }).format(new Date(value));
}

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  in_review: "En revisión",
  approved: "Aprobada",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  received: "Pedido recibido",
  in_review: "En revisión",
  availability_confirmed: "Disponibilidad confirmada",
  approved: "Pedido aprobado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export const STOCK_LABEL: Record<string, string> = {
  available: "Disponible",
  low: "Bajo inventario",
  inquire: "Consultar existencia",
  out: "Agotado",
};

export function distributorPrice(listPrice: number, discountPct: number) {
  return Math.round(Number(listPrice) * (1 - Number(discountPct) / 100) * 100) / 100;
}
