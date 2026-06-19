export function hoyLocalISO(): string {
  const h = new Date();
  const y = h.getFullYear();
  const m = String(h.getMonth() + 1).padStart(2, '0');
  const d = String(h.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convierte YYYY-MM-DD a timestamp (mediodía local, sin ambigüedad de zona) */
export function fechaLocalAHora(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return Date.now();
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

export function formatFechaReparto(ts: number): string {
  return new Date(ts).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
