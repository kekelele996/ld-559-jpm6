import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUpApi } from '../api/followUpApi';
import type { FollowUpPlan } from '../types/followup';

export const useFollowUps = (petId?: string, active = false) =>
  useQuery({
    queryKey: ['follow-ups', petId, active],
    queryFn: () => followUpApi.list({ petId, active }),
    enabled: Boolean(petId),
  });

export const useNextFollowUp = (petId?: string) =>
  useQuery({
    queryKey: ['follow-up-next', petId],
    queryFn: () => followUpApi.next(petId as string),
    enabled: Boolean(petId),
  });

function invalidateFollowUps(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ['follow-ups'] });
  void client.invalidateQueries({ queryKey: ['follow-up-next'] });
  void client.invalidateQueries({ queryKey: ['notifications'] });
}

export const useConfirmFollowUp = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUpApi.confirm(id),
    onSuccess: () => invalidateFollowUps(client),
  });
};

export const useRescheduleFollowUp = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledDate }: { id: string; scheduledDate: string }) =>
      followUpApi.reschedule(id, scheduledDate),
    onSuccess: () => invalidateFollowUps(client),
  });
};

export const useCompleteFollowUp = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => followUpApi.complete(id),
    onSuccess: () => invalidateFollowUps(client),
  });
};

export type { FollowUpPlan };
