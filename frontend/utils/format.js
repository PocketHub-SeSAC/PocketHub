/* 화면 표시용 형식 */
export function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(n / 1024))}KB`;
}

const pad = (n) => String(n).padStart(2, '0');

/** ISO → 2026.11.03 */
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** ISO → 2026.11.03 14:20 */
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 2026-11-05 → 11.05 (포스트잇용 짧은 날짜) */
export function shortDay(ymd) {
  if (!ymd) return '';
  const [, m, d] = String(ymd).split('-');
  return m && d ? `${m}.${d}` : String(ymd);
}

/** 2026-11-05 → 2026.11.05 */
export const dotDay = (ymd) => (ymd ? String(ymd).replaceAll('-', '.') : '');
