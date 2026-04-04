import { getApiBaseUrl } from '../config';

/** Turn relative `/uploads/...` paths into absolute URLs for `<Image source={{ uri }} />`. */
export function resolvePostMediaUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const base = getApiBaseUrl().replace(/\/$/, '');
  if (t.startsWith('/')) return `${base}${t}`;
  return `${base}/${t}`;
}
