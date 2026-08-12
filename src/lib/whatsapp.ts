/** Construye un enlace wa.me con mensaje precargado. Normaliza a lada MX (+52) si falta. */
export function waLink(phone: string, message: string) {
  const digits = String(phone).replace(/\D/g, "");
  const intl = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
