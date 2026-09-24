import { Tag } from 'antd';
import { FollowUpStatus, InsuranceStatus, VaccineStatus, enumLabels, followUpStatusLabels } from '../../constants/enums';

type Status = VaccineStatus | InsuranceStatus | FollowUpStatus | string;

// COMPLETED / PENDING 在疫苗与复诊枚举中字符串相同，颜色也一致，故只声明一次
const colors: Record<string, string> = {
  COMPLETED: 'green',
  PENDING: 'gold',
  [VaccineStatus.OVERDUE]: 'red',
  [InsuranceStatus.ACTIVE]: 'green',
  [InsuranceStatus.PENDING_RENEWAL]: 'orange',
  [InsuranceStatus.EXPIRED]: 'red',
  [InsuranceStatus.CLAIMING]: 'blue',
  [FollowUpStatus.CONFIRMED]: 'blue',
  [FollowUpStatus.CANCELLED]: 'default',
};

export function StatusBadge({ status, domain }: { status: Status; domain?: 'followup' }) {
  const label = domain === 'followup' ? followUpStatusLabels[status] : enumLabels[status];
  return <Tag color={colors[status] || 'default'}>{label || status}</Tag>;
}
