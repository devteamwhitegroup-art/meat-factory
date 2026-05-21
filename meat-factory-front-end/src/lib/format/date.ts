import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/mn';

dayjs.extend(relativeTime);
dayjs.locale('mn');

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return dayjs(d).format('YYYY-MM-DD');
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
}

export function fromNow(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return dayjs(d).fromNow();
}
