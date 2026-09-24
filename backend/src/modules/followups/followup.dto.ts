import { IsDateString, IsOptional } from 'class-validator';

export class RescheduleFollowUpDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}
