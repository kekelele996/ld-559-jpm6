import { Alert, Button, Card, DatePicker, Empty, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { FollowUpStatus, followUpStatusLabels } from '../../constants/enums';
import {
  useCompleteFollowUp,
  useConfirmFollowUp,
  useRescheduleFollowUp,
} from '../../hooks/useFollowUps';
import type { FollowUpPlan } from '../../types/followup';
import { followUpCountdown, nextFollowUpReminder } from '../../utils/followUp';

interface Props {
  plan: FollowUpPlan | null;
}

export function FollowUpNextCard({ plan }: Props) {
  const [picking, setPicking] = useState(false);
  const [nextDate, setNextDate] = useState<Dayjs | null>(null);
  const confirm = useConfirmFollowUp();
  const reschedule = useRescheduleFollowUp();
  const complete = useCompleteFollowUp();

  if (!plan) {
    return (
      <Card>
        <Empty description="暂无待复诊安排" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const reminder = nextFollowUpReminder(plan.scheduledDate, plan.sevenDayReminded, plan.dueDayReminded);
  const scheduled = dayjs(plan.scheduledDate).format('YYYY-MM-DD');
  const isOverdue = dayjs(plan.scheduledDate).isBefore(dayjs().startOf('day'), 'day');

  const submitReschedule = () => {
    if (!nextDate) return;
    reschedule.mutate(
      { id: plan.id, scheduledDate: nextDate.format('YYYY-MM-DD') },
      { onSuccess: () => setPicking(false) },
    );
  };

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>下一次复诊</span>
          <Tag color={plan.status === FollowUpStatus.CONFIRMED ? 'blue' : 'gold'}>
            {followUpStatusLabels[plan.status]}
          </Tag>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {scheduled}
        </Typography.Title>
        <Typography.Text type={isOverdue ? 'danger' : 'secondary'}>
          {followUpCountdown(plan.scheduledDate)}
        </Typography.Text>
        {reminder ? (
          <Alert
            type={reminder.kind === 'DUE_DAY' ? 'warning' : 'info'}
            showIcon
            message={`下一次提醒：${reminder.text}`}
          />
        ) : (
          <Alert type="success" showIcon message="提醒已全部发送，等待复诊" />
        )}
        {plan.medicalRecord?.diagnosis && (
          <Typography.Text type="secondary">来源就诊：{plan.medicalRecord.diagnosis}</Typography.Text>
        )}
        <Space wrap>
          {plan.status === FollowUpStatus.PENDING && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={confirm.isPending}
              onClick={() => confirm.mutate(plan.id)}
            >
              确认预约
            </Button>
          )}
          <Button onClick={() => { setNextDate(dayjs(plan.scheduledDate)); setPicking(true); }}>
            改到更晚日期
          </Button>
          <Button loading={complete.isPending} onClick={() => complete.mutate(plan.id)}>
            标记完成
          </Button>
        </Space>
        {picking && (
          <Space>
            <DatePicker
              value={nextDate}
              onChange={setNextDate}
              allowClear={false}
              disabledDate={(current) => {
                const original = dayjs(plan.scheduledDate).startOf('day');
                return Boolean(current && (current.isBefore(original, 'day') || current.isSame(original, 'day')));
              }}
            />
            <Button type="primary" onClick={submitReschedule} loading={reschedule.isPending}>
              保存
            </Button>
            <Button onClick={() => setPicking(false)}>取消</Button>
          </Space>
        )}
      </Space>
    </Card>
  );
}
