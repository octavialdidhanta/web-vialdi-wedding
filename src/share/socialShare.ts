export function buildShareText(title: string, url: string) {
  const t = title.trim();
  const u = url.trim();
  if (t && u) return `${t} ${u}`;
  return t || u;
}

export function buildFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildTwitterShareUrl(text: string, url: string) {
  const params = new URLSearchParams();
  if (text.trim()) params.set("text", text);
  if (url.trim()) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildLinkedInShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

