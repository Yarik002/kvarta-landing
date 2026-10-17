/** IP клиента за прокси Vercel/Cloudflare и локально. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const candidates = [
    headers.get("x-real-ip"),
    headers.get("cf-connecting-ip"),
    headers.get("x-vercel-forwarded-for"),
  ];

  for (const candidate of candidates) {
    const value = candidate?.split(",")[0]?.trim();
    if (value) {
      return value;
    }
  }

  return "unknown";
}
