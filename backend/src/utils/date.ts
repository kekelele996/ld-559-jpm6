export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

/**
 * 将 ISO 字符串归一化为 UTC 日历日的零点。
 * 复诊、就诊等业务字段按"日期"语义存储，避免本地/UTC 时区偏差。
 */
export function toUtcDay(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** 仅按日历日比较：b 是否严格晚于 a */
export function isLaterUtcDay(a: Date, b: Date) {
  const dayA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const dayB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return dayB > dayA;
}
