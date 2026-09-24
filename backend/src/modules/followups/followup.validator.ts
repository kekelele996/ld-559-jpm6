import { FollowUpStatus } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';

export function assertFollowUpActionable(status: string) {
  if (status === FollowUpStatus.COMPLETED) throw new BusinessException('该复诊安排已完成');
  if (status === FollowUpStatus.CANCELLED) throw new BusinessException('该复诊安排已撤下');
}

export function validateLaterDueDate(next: Date, current: Date) {
  if (next.getTime() <= current.getTime()) throw new BusinessException('只能改到更晚的复诊日期');
}
