import dayjs from 'dayjs';

function parseDay(value: string) {
  // 仅日期（YYYY-MM-DD）按 UTC 零点存储，与后端 toUtcDay 保持一致
  return dayjs(value).startOf('day');
}

export type FollowUpReminder = { kind: 'SEVEN_DAY' | 'DUE_DAY'; date: string; text: string };

/**
 * 计算下一次复诊提醒节点：到期前 7 天窗口（第 1~7 天）、到期当天各一次。
 * 已发送的节点跳过；没有待发送节点时返回 null（已完成的安排由调用方过滤）。
 */
export function nextFollowUpReminder(
  scheduledDate: string,
  sevenDayReminded: boolean,
  dueDayReminded: boolean,
): FollowUpReminder | null {
  const due = parseDay(scheduledDate);
  const today = dayjs().startOf('day');
  const sevenDayStart = due.subtract(7, 'day');

  if (today.isSame(due, 'day')) {
    return dueDayReminded
      ? null
      : { kind: 'DUE_DAY', date: due.format('YYYY-MM-DD'), text: `到期当天提醒（${due.format('YYYY-MM-DD')}）` };
  }

  if (today.isBefore(due, 'day')) {
    if (!sevenDayReminded) {
      return {
        kind: 'SEVEN_DAY',
        date: sevenDayStart.format('YYYY-MM-DD'),
        text: `复诊临近提醒（${sevenDayStart.format('MM-DD')} 起 7 天内）`,
      };
    }
    if (!dueDayReminded) {
      return { kind: 'DUE_DAY', date: due.format('YYYY-MM-DD'), text: `到期当天提醒（${due.format('YYYY-MM-DD')}）` };
    }
  }

  return null;
}

/** 距复诊日的人性化描述，已过期的待办提示尽快就诊 */
export function followUpCountdown(scheduledDate: string): string {
  const due = parseDay(scheduledDate);
  const today = dayjs().startOf('day');
  const diff = due.diff(today, 'day');
  if (diff === 0) return '今天复诊';
  if (diff < 0) return `已逾期 ${Math.abs(diff)} 天，请尽快就诊`;
  return `${diff} 天后复诊`;
}
