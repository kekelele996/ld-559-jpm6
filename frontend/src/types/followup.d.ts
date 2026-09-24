import { FollowUpStatus } from '../constants/enums';
import type { MedicalRecord } from './medical';
import type { Pet } from './pet';

export interface FollowUpPlan {
  id: string;
  petId: string;
  medicalRecordId: string;
  scheduledDate: string;
  status: FollowUpStatus;
  sevenDayReminded: boolean;
  dueDayReminded: boolean;
  pet?: Pet;
  medicalRecord?: MedicalRecord;
  createdAt: string;
  updatedAt: string;
}
