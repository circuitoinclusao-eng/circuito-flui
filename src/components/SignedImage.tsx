import { useEffect, useState } from "react";
import { getSignedStorageUrl } from "@/lib/storage";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** URL antiga (pública) ou caminho no bucket. */
  src?: string | null;
  bucket?: string;
  path?: string;
  fallback?: React.ReactNode;
};

/**
 * <SignedImage /> — exibe imagens armazenadas em buckets privados
 * usando URLs assinadas temporárias.
 */
export function SignedImage({ src, bucket, path, fallback, ...img }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const value = bucket && path
        ? await getSignedStorageUrl(bucket, path)
        : src
          ? await getSignedStorageUrl(src)
          : null;
      if (active) setUrl(value);
    })();
    return () => { active = false; };
  }, [src, bucket, path]);

  if (!url) return (fallback as any) ?? null;
  return <img src={url} {...img} />;
}
