// next/image loader for ImageKit URLs: ImageKit resizes the image (fast, no Vercel cost).
export default function imagekitLoader({ src, width, quality }) {
  if (!/^https:\/\//.test(src)) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}tr=w-${width},q-${quality || 90},f-auto`;
}
