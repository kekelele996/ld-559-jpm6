import { FollowUpStatus } from '../constants/enums';
import { Pet } from './pet';

export interface FollowUpPlan {
  id: string;
  petId: string;
  medicalRecordId: string;
  dueDate: string;
  status: FollowUpStatus;
  confirmedAt?: string;
  completedAt?: string;
  remindedAt7d?: string;
  remindedAtDue?: string;
  pet?: Pet;
}
