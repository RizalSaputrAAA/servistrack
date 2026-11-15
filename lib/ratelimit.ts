// Rate limit sederhana (in-memory) untuk endpoint publik.
const hits = new Map<string, number[]>();
export function limited(req: Request, max = 30) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}
