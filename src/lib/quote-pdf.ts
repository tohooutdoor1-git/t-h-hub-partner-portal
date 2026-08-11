import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { money2 } from "@/lib/format";

type Item = Record<string, any>;

/** Genera y descarga el PDF de una cotización TÖHÖ. */
export function downloadQuotePdf(quote: Record<string, any>) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const folio = String(quote["folio"] ?? "COT");
  const items = (quote["items"] ?? []) as Item[];
  const dist = quote["distributor"] as Record<string, any> | undefined;
  const seller = quote["seller"] as Record<string, any> | undefined;

  doc.setFillColor(12, 148, 154);
  doc.rect(0, 0, 595, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("TÖHÖ HUB", 40, 34);
  doc.setFontSize(11);
  doc.text(`Cotización ${folio}`, 40, 54);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  const meta = [
    `Distribuidor: ${dist?.["company"] ?? "—"}`,
    `Contacto: ${dist?.["contact_name"] ?? "—"}${dist?.["email"] ? ` · ${dist["email"]}` : ""}`,
    `Ejecutivo: ${seller?.["name"] ?? "por asignar"}`,
    `Nivel: ${quote["level_code"] ?? "—"} · Descuento ${Number(quote["discount_pct"] ?? 0)}%`,
    `Fecha: ${new Date(String(quote["submitted_at"] ?? quote["created_at"])).toLocaleDateString("es-MX")}`,
  ];
  meta.forEach((line, i) => doc.text(line, 40, 96 + i * 15));

  autoTable(doc, {
    startY: 96 + meta.length * 15 + 12,
    head: [["SKU", "Producto", "Cant.", "Precio lista", "Precio nivel", "Importe"]],
    body: items.map((i) => [
      String(i["sku"] ?? ""),
      String(i["name"] ?? ""),
      String(i["quantity"] ?? 0),
      money2(i["list_price"]),
      money2(i["unit_price"]),
      money2(Number(i["unit_price"]) * Number(i["quantity"])),
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [12, 148, 154], textColor: 255 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  const endY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 400;
  const totals: Array<[string, string]> = [
    ["Subtotal lista", money2(quote["subtotal_list"])],
    ["Descuento", `- ${money2(quote["discount_amount"])}`],
    ["Total (MXN)", money2(quote["total"])],
  ];
  totals.forEach(([label, value], i) => {
    const y = endY + 24 + i * 16;
    doc.setFontSize(i === totals.length - 1 ? 12 : 10);
    doc.text(label, 380, y);
    doc.text(value, 555, y, { align: "right" });
  });

  if (quote["comments"]) {
    doc.setFontSize(9);
    doc.text(`Comentarios: ${String(quote["comments"])}`, 40, endY + 80, { maxWidth: 300 });
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Documento informativo generado por TÖHÖ HUB. Precios en MXN, sujetos a disponibilidad de inventario.",
    40,
    810,
  );

  doc.save(`${folio}.pdf`);
}
