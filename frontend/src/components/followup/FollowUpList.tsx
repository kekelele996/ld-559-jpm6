import { Card, Table, Tag } from 'antd';
import { FollowUpStatus } from '../../constants/enums';
import type { FollowUpPlan } from '../../types/followup';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/format';

const activeStatuses = [FollowUpStatus.PENDING, FollowUpStatus.CONFIRMED];

export function FollowUpList({ plans }: { plans: FollowUpPlan[] }) {
  return (
    <Card title={`全部复诊安排（${plans.length}）`}>
      <Table
        rowKey="id"
        size="middle"
        dataSource={plans}
        pagination={false}
        columns={[
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (status: FollowUpStatus) => <StatusBadge status={status} domain="followup" />,
          },
          { title: '计划日期', dataIndex: 'scheduledDate', width: 140, render: formatDate },
          {
            title: '提醒进度',
            width: 200,
            render: (_, record) => (
              <span>
                <Tag color={record.sevenDayReminded ? 'green' : 'default'}>
                  7 天前 {record.sevenDayReminded ? '已提醒' : '待提醒'}
                </Tag>
                <Tag color={record.dueDayReminded ? 'green' : 'default'}>
                  当天 {record.dueDayReminded ? '已提醒' : '待提醒'}
                </Tag>
              </span>
            ),
          },
          {
            title: '关联就诊',
            render: (_, record) => record.medicalRecord?.diagnosis || '-',
          },
          {
            title: '是否待办',
            width: 100,
            render: (_, record) =>
              activeStatuses.includes(record.status) ? <Tag color="processing">待办中</Tag> : <Tag>已归档</Tag>,
          },
        ]}
      />
    </Card>
  );
}
