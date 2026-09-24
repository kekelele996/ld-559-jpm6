import { Injectable } from '@nestjs/common';
import { UserRole } from '../../constants/enums';
import { toUtcDay } from '../../utils/date';
import { CreateMedicalDto, UpdateMedicalDto } from './medical.dto';
import { MedicalRepository } from './medical.repository';
import { validateMedicalCost } from './medical.validator';
import { FollowUpService } from '../followups/followup.service';

@Injectable()
export class MedicalService {
  constructor(
    private readonly repo: MedicalRepository,
    private readonly followUpService: FollowUpService,
  ) {}

  list(user: { sub: string; role: UserRole }, petId?: string, type?: string) {
    return this.repo.findMany(user, petId, type);
  }

  async create(dto: CreateMedicalDto) {
    validateMedicalCost(dto.cost);
    const nextVisitDate = dto.nextVisitDate ? toUtcDay(dto.nextVisitDate) : null;
    const record = await this.repo.create({
      ...dto,
      visitDate: new Date(dto.visitDate),
      nextVisitDate,
      attachments: dto.attachments || [],
    });
    await this.followUpService.syncWithMedicalRecord(record.id, record.petId, nextVisitDate);
    return record;
  }

  async update(id: string, dto: UpdateMedicalDto) {
    validateMedicalCost(dto.cost);
    const nextVisitDate = dto.nextVisitDate ? toUtcDay(dto.nextVisitDate) : null;
    const record = await this.repo.update(id, {
      ...dto,
      visitDate: new Date(dto.visitDate),
      nextVisitDate,
      attachments: dto.attachments || [],
    });
    await this.followUpService.syncWithMedicalRecord(record.id, record.petId, nextVisitDate);
    return record;
  }
}
