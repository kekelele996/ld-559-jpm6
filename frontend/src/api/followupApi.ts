import { request, unwrap } from '../utils/request';
import type { FollowUpPlan } from '../types/followup';
import { mockFollowUps } from '../utils/mockData';

export const followupApi = {
  list: (params?: { petId?: string }) => unwrap<FollowUpPlan[]>(request.get('/follow-ups', { params }), mockFollowUps),
  confirm: (id: string) => request.patch(`/follow-ups/${id}/confirm`),
  reschedule: (id: string, dueDate: string) => request.patch(`/follow-ups/${id}/reschedule`, { dueDate }),
  complete: (id: string) => request.patch(`/follow-ups/${id}/complete`),
};
