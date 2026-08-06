import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-media";
const TTL = 60 * 60 * 24 * 7;

function isRemote(value: string) {
  return /^https?:\/\//i.test(value);
}

/** Signs storage paths. Values that are already absolute URLs are returned untouched. */
export async function signMedia(
  supabase: SupabaseClient,
  values: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const paths = Array.from(
    new Set(values.filter((v): v is string => Boolean(v) && !isRemote(v as string))),
  );
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, TTL);
  if (error) return {};
  const map: Record<string, string> = {};
  (data ?? []).forEach((row, i) => {
    const key = row.path ?? paths[i];
    if (key && row.signedUrl) map[key] = row.signedUrl;
  });
  return map;
}

export function resolveMedia(value: string | null | undefined, map: Record<string, string>) {
  if (!value) return null;
  if (isRemote(value)) return value;
  return map[value] ?? null;
}
