import { Button, DatePicker, List, Space } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { followupApi } from '../../api/followupApi';
import { usePetFollowUps } from '../../hooks/usePets';
import { StatusBadge } from './StatusBadge';
import { FollowUpStatus, followUpStatusLabels } from '../../constants/enums';
import { formatDate } from '../../utils/format';
import type { FollowUpPlan } from '../../types/followup';

function nextReminderText(plan: FollowUpPlan) {
  if (plan.status === FollowUpStatus.COMPLETED) return '已完成，不再提醒';
  if (plan.status === FollowUpStatus.CANCELLED) return '已撤下，不再提醒';
  if (!plan.remindedAt7d) {
    const remindAt = dayjs(plan.dueDate).subtract(7, 'day');
    return remindAt.isAfter(dayjs(), 'day')
      ? `下次提醒：${remindAt.format('YYYY-MM-DD')}（到期前 7 天）`
      : '下次提醒：今天（到期前 7 天）';
  }
  if (!plan.remindedAtDue) return `下次提醒：${formatDate(plan.dueDate)}（到期当天）`;
  return '提醒已发送';
}

export function FollowUpPanel({ petId }: { petId: string }) {
  const client = useQueryClient();
  const { data = [] } = usePetFollowUps(petId);
  const refresh = () => client.invalidateQueries({ queryKey: ['followups', petId] });
  const confirm = useMutation({ mutationFn: followupApi.confirm, onSettled: refresh });
  const complete = useMutation({ mutationFn: followupApi.complete, onSettled: refresh });
  const reschedule = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) => followupApi.reschedule(id, dueDate),
    onSettled: refresh,
  });

  return (
    <List
      dataSource={data}
      locale={{ emptyText: '暂无复诊安排' }}
      renderItem={(plan) => {
        const active = plan.status === FollowUpStatus.PENDING || plan.status === FollowUpStatus.CONFIRMED;
        const actions: ReactNode[] = [];
        if (active) {
          if (plan.status === FollowUpStatus.PENDING) {
            actions.push(
              <Button key="confirm" type="link" loading={confirm.isPending} onClick={() => confirm.mutate(plan.id)}>
                确认预约
              </Button>,
            );
          }
          actions.push(
            <DatePicker
              key="reschedule"
              placeholder="改到更晚日期"
              disabledDate={(current) => !current.isAfter(dayjs(plan.dueDate))}
              onChange={(date) => date && reschedule.mutate({ id: plan.id, dueDate: date.format('YYYY-MM-DD') })}
            />,
            <Button key="complete" type="link" loading={complete.isPending} onClick={() => complete.mutate(plan.id)}>
              标记完成
            </Button>,
          );
        }
        return (
          <List.Item actions={actions}>
            <List.Item.Meta
              title={<Space>复诊日期 {formatDate(plan.dueDate)}<StatusBadge status={plan.status} labels={followUpStatusLabels} /></Space>}
              description={nextReminderText(plan)}
            />
          </List.Item>
        );
      }}
    />
  );
}
