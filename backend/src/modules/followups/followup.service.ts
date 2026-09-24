import { Injectable } from '@nestjs/common';
import { FollowUpStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { RescheduleFollowUpDto } from './followup.dto';
import { FollowUpRepository } from './followup.repository';
import { assertFollowUpActionable, validateLaterDueDate } from './followup.validator';

interface MedicalRecordSnapshot {
  id: string;
  petId: string;
  nextVisitDate: Date | null;
}

@Injectable()
export class FollowUpService {
  constructor(private readonly repo: FollowUpRepository) {}

  list(user: { sub: string; role: UserRole }, petId?: string) {
    return this.repo.findMany(user, petId);
  }

  /** 医生新增/修改就诊记录后调用：生成、顺延或撤下复诊计划，同一份记录只对应一条计划 */
  async syncFromMedicalRecord(record: MedicalRecordSnapshot) {
    const existing = await this.repo.findByMedicalRecordId(record.id);
    if (!record.nextVisitDate) {
      // 医生取消复诊日期，进行中的待办同步撤下；已完成的保留结果
      if (existing && existing.status !== FollowUpStatus.COMPLETED && existing.status !== FollowUpStatus.CANCELLED) {
        await this.repo.update(existing.id, { status: FollowUpStatus.CANCELLED, confirmedAt: null });
      }
      return;
    }
    const dueDate = new Date(record.nextVisitDate);
    if (!existing) {
      await this.repo.create({ petId: record.petId, medicalRecordId: record.id, dueDate, status: FollowUpStatus.PENDING });
      return;
    }
    const sameDate = existing.dueDate.getTime() === dueDate.getTime();
    if (sameDate && existing.status !== FollowUpStatus.CANCELLED) return;
    // 复诊日期变化（顺延）或取消后重新填写：重置为待确认并重新计算提醒
    await this.repo.update(existing.id, {
      dueDate,
      status: FollowUpStatus.PENDING,
      confirmedAt: null,
      completedAt: null,
      remindedAt7d: null,
      remindedAtDue: null,
    });
  }

  async confirm(id: string, user: { sub: string; role: UserRole }) {
    await this.getActionable(id, user);
    return this.repo.update(id, { status: FollowUpStatus.CONFIRMED, confirmedAt: new Date() });
  }

  async reschedule(id: string, dto: RescheduleFollowUpDto, user: { sub: string; role: UserRole }) {
    const plan = await this.getActionable(id, user);
    const dueDate = new Date(dto.dueDate);
    validateLaterDueDate(dueDate, plan.dueDate);
    // 改期后按新日期重新提醒
    return this.repo.update(id, { dueDate, remindedAt7d: null, remindedAtDue: null });
  }

  async complete(id: string, user: { sub: string; role: UserRole }) {
    await this.getActionable(id, user);
    return this.repo.update(id, { status: FollowUpStatus.COMPLETED, completedAt: new Date() });
  }

  private async getActionable(id: string, user: { sub: string; role: UserRole }) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new BusinessException('复诊安排不存在', 40401);
    if (user.role === UserRole.VET) throw new BusinessException('仅宠物主人可处理复诊安排', 40302);
    if (user.role === UserRole.PET_OWNER && plan.pet.ownerId !== user.sub) throw new BusinessException('无权操作该复诊安排', 40302);
    assertFollowUpActionable(plan.status);
    return plan;
  }
}
