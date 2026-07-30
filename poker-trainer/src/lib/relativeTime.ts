export function relativeTime(ms: number, now: number = Date.now()): string {
  const diff = now - ms;
  if (diff < 0) return "agora";
  const min = diff / 60000;
  if (min < 1) return "agora";
  if (min < 60) return `há ${Math.floor(min)} min`;
  const hr = min / 60;
  if (hr < 24) return `há ${Math.floor(hr)} h`;
  const day = hr / 24;
  if (day < 7) return `há ${Math.floor(day)} d`;
  return new Date(ms).toLocaleDateString("pt-BR");
}
