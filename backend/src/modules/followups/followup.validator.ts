import { BusinessException } from '../../exceptions/business.exception';
import { FollowUpStatus } from '../../constants/enums';
import { isLaterUtcDay } from '../../utils/date';

/** 主人只允许把复诊改到更晚的日期（按日历日比较） */
export function validateLaterDate(currentDate: Date, nextDate: Date) {
  if (!isLaterUtcDay(currentDate, nextDate)) {
    throw new BusinessException('改约只能顺延到更晚的日期');
  }
}

/** 确认 / 改期 / 完成只允许对待确认或已确认的待办操作 */
export function assertPlanActive(status: FollowUpStatus) {
  if (status !== FollowUpStatus.PENDING && status !== FollowUpStatus.CONFIRMED) {
    throw new BusinessException('该复诊安排已结束，无法操作');
  }
}
