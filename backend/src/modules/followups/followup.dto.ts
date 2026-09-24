import { IsDateString } from 'class-validator';

export class RescheduleFollowUpDto {
  @IsDateString() dueDate!: string;
}
