import { supabase } from "@/integrations/supabase/client";

// Cache de URLs assinadas: chave = `${bucket}/${path}` -> { url, expiresAt }
const cache = new Map<string, { url: string; expiresAt: number }>();
const TTL_SECONDS = 3600; // 1h

/**
 * Extrai bucket+path de uma URL pública antiga do Supabase Storage,
 * ou aceita um par bucket+path direto.
 */
export function parseStorageRef(input: string | null | undefined):
  | { bucket: string; path: string }
  | null {
  if (!input) return null;
  // Padrão: .../storage/v1/object/(public|sign)/{bucket}/{path}
  const m = input.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
  if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) };
  return null;
}

/**
 * Devolve uma URL assinada temporária para um arquivo do Storage.
 * Aceita uma URL antiga (pública) ou bucket+path. Faz cache em memória.
 */
export async function getSignedStorageUrl(
  bucketOrUrl: string,
  path?: string,
  expiresIn = TTL_SECONDS,
): Promise<string | null> {
  let bucket = bucketOrUrl;
  let key = path ?? "";
  if (!path) {
    const parsed = parseStorageRef(bucketOrUrl);
    if (!parsed) return bucketOrUrl ?? null;
    bucket = parsed.bucket;
    key = parsed.path;
  }
  const cacheKey = `${bucket}/${key}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now + 60_000) return cached.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, expiresIn);
  if (error || !data?.signedUrl) return null;
  cache.set(cacheKey, { url: data.signedUrl, expiresAt: now + expiresIn * 1000 });
  return data.signedUrl;
}
