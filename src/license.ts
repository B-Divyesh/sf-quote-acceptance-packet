const SLUG = 'quote-acceptance-packet';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
export const BUY_URL = `https://api.sociobot.in/api/v1/products/${SLUG}/checkout`;

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export function captureLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function cachedLicense(): { token: string; unlocked: boolean; reason?: string } {
  const token = localStorage.getItem(KEY) || '';
  if (!token) return { token, unlocked: false };
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '') as Verdict;
    return { token, unlocked: verdict.valid, reason: verdict.reason };
  } catch { return { token, unlocked: true }; }
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(KEY);
  if (!token) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as Verdict;
    if (!force && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return cached.valid;
  } catch { /* verify now */ }
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verify unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
    return result.valid;
  } catch {
    return cachedLicense().unlocked;
  }
}

export function saveLicense(token: string): void {
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}
