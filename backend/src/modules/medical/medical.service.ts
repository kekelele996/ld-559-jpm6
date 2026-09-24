import { Injectable } from '@nestjs/common';
import { UserRole } from '../../constants/enums';
import { FollowUpService } from '../followups/followup.service';
import { CreateMedicalDto, UpdateMedicalDto } from './medical.dto';
import { MedicalRepository } from './medical.repository';
import { validateMedicalCost } from './medical.validator';

@Injectable()
export class MedicalService {
  constructor(
    private readonly repo: MedicalRepository,
    private readonly followUps: FollowUpService,
  ) {}

  list(user: { sub: string; role: UserRole }, petId?: string, type?: string) {
    return this.repo.findMany(user, petId, type);
  }

  async create(dto: CreateMedicalDto) {
    validateMedicalCost(dto.cost);
    const record = await this.repo.create({
      ...dto,
      visitDate: new Date(dto.visitDate),
      nextVisitDate: dto.nextVisitDate ? new Date(dto.nextVisitDate) : undefined,
      attachments: dto.attachments || [],
    });
    await this.followUps.syncFromMedicalRecord(record);
    return record;
  }

  async update(id: string, dto: UpdateMedicalDto) {
    validateMedicalCost(dto.cost);
    const record = await this.repo.update(id, {
      ...dto,
      visitDate: new Date(dto.visitDate),
      nextVisitDate: dto.nextVisitDate ? new Date(dto.nextVisitDate) : null,
      attachments: dto.attachments || [],
    });
    await this.followUps.syncFromMedicalRecord(record);
    return record;
  }
}
