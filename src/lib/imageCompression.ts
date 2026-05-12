// Comprime imagens grandes no navegador antes de enviar.
// - Aceita JPG, JPEG, PNG, WEBP
// - Reduz para no máx. `maxSize` no maior lado
// - Converte para JPEG (qualidade 0.85) por padrão; preserva PNG com transparência
// - Em caso de falha, retorna o arquivo original
export interface CompressOptions {
  maxSize?: number; // px no maior lado
  quality?: number; // 0..1
  maxBytes?: number; // se arquivo já for menor que isso, não comprime
  preferWebp?: boolean;
}

const SUPPORTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxSize = 1600, quality = 0.85, maxBytes = 600 * 1024, preferWebp = false } = opts;
  try {
    if (!file.type || !SUPPORTED.includes(file.type)) return file;
    if (file.size <= maxBytes) return file;

    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap as any, 0, 0, w, h);
    if ((bitmap as any).close) (bitmap as any).close();

    // Decide formato de saída
    const isPng = file.type === "image/png";
    const outType = preferWebp ? "image/webp" : (isPng ? "image/jpeg" : "image/jpeg");
    const outExt = outType === "image/webp" ? ".webp" : ".jpg";

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, outType, quality));
    if (!blob) return file;
    if (blob.size >= file.size) return file; // não compensa

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], baseName + outExt, { type: outType, lastModified: Date.now() });
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file); } catch { /* fallback abaixo */ }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
