import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

export const importRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        mode: z.enum(["products", "stock", "prices"]),
        dryRun: z.boolean().default(true),
        rows: z.array(rowSchema).max(5000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/hub.server");
    await assertAdmin(context.supabase, context.userId);
    const { runImport } = await import("@/lib/import.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runImport(supabaseAdmin, data.mode, data.rows, data.dryRun);
  });
