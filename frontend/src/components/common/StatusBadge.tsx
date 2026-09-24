import { Tag } from 'antd';
import { FollowUpStatus, InsuranceStatus, VaccineStatus, enumLabels } from '../../constants/enums';

type Status = VaccineStatus | InsuranceStatus | FollowUpStatus | string;

const colors: Record<string, string> = {
  [VaccineStatus.COMPLETED]: 'green',
  [VaccineStatus.PENDING]: 'gold',
  [VaccineStatus.OVERDUE]: 'red',
  [InsuranceStatus.ACTIVE]: 'green',
  [InsuranceStatus.PENDING_RENEWAL]: 'orange',
  [InsuranceStatus.EXPIRED]: 'red',
  [InsuranceStatus.CLAIMING]: 'blue',
  [FollowUpStatus.CONFIRMED]: 'blue',
  [FollowUpStatus.CANCELLED]: 'default',
};

export function StatusBadge({ status, labels }: { status: Status; labels?: Record<string, string> }) {
  const map = labels || enumLabels;
  return <Tag color={colors[status] || 'default'}>{map[status as keyof typeof map] || status}</Tag>;
}
