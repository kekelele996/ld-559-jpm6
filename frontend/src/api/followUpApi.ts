import { request, unwrap } from '../utils/request';
import type { FollowUpPlan } from '../types/followup';
import { mockFollowUps } from '../utils/mockData';

export const followUpApi = {
  list: (params?: { petId?: string; active?: boolean }) =>
    unwrap<FollowUpPlan[]>(request.get('/follow-ups', { params }), mockFollowUps),
  next: (petId: string) =>
    unwrap<FollowUpPlan | null>(
      request.get('/follow-ups/next', { params: { petId } }),
      mockFollowUps.find((item) => item.petId === petId && item.status !== 'COMPLETED') || null,
    ),
  confirm: (id: string) => request.patch(`/follow-ups/${id}/confirm`),
  reschedule: (id: string, scheduledDate: string) =>
    request.patch(`/follow-ups/${id}/reschedule`, { scheduledDate }),
  complete: (id: string) => request.patch(`/follow-ups/${id}/complete`),
};
