const mnt = new Intl.NumberFormat('mn-MN', {
  style: 'currency',
  currency: 'MNT',
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 2 });

export function formatMNT(n: number | string | null | undefined): string {
  if (n == null) return '—';
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return '—';
  return mnt.format(v);
}

export function formatNumber(n: number | string | null | undefined): string {
  if (n == null) return '—';
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return '—';
  return num.format(v);
}
