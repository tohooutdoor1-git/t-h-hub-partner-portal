/**
 * Envío de correo del HUB. Mientras no exista un dominio de correo verificado
 * para el proyecto, las notificaciones quedan registradas en la app y el envío
 * se reporta como no realizado (sin romper el flujo de negocio).
 */
export async function sendHubEmail(
  to: Array<string | null | undefined>,
  subject: string,
  body: string,
): Promise<{ sent: boolean; reason?: string }> {
  const recipients = to.filter((v): v is string => Boolean(v));
  if (recipients.length === 0) return { sent: false, reason: "no_recipient" };

  const apiKey = process.env["LOVABLE_API_KEY"];
  const senderDomain = process.env["HUB_EMAIL_DOMAIN"];
  if (!apiKey || !senderDomain) {
    console.info(`[hub-email] pendiente de configuración: "${subject}" -> ${recipients.join(", ")}`);
    return { sent: false, reason: "email_not_configured" };
  }

  try {
    const res = await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `TÖHÖ HUB <hub@${senderDomain}>`,
        to: recipients,
        subject,
        html: `<p style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937">${body}</p>`,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[hub-email] fallo ${res.status}: ${text}`);
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[hub-email] error", e);
    return { sent: false, reason: "network_error" };
  }
}
