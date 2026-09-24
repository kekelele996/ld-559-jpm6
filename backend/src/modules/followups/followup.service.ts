import { Injectable } from '@nestjs/common';
import { UserRole, FollowUpStatus } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { toUtcDay } from '../../utils/date';
import { RescheduleFollowUpDto } from './followup.dto';
import { FollowUpRepository } from './followup.repository';
import { assertPlanActive, validateLaterDate } from './followup.validator';

@Injectable()
export class FollowUpService {
  constructor(private readonly repo: FollowUpRepository) {}

  list(user: { sub: string; role: UserRole }, petId?: string, activeOnly?: boolean) {
    return this.repo.findMany(user, petId, activeOnly);
  }

  async next(user: { sub: string; role: UserRole }, petId: string) {
    const plans = await this.repo.findMany(user, petId, true);
    return plans[0] ?? null;
  }

  /**
   * 医生新增/修改就诊记录时同步复诊待办：
   * - 有复诊日期且无待办：生成待复诊计划
   * - 有复诊日期且有待办：顺延日期并重置提醒标记（同一份记录不重复出现）
   * - 复诊日期被清空：未完成的待办同步撤下，已完成的保留为历史
   */
  async syncWithMedicalRecord(medicalRecordId: string, petId: string, nextVisitDate: Date | null) {
    const existing = await this.repo.findByMedicalRecord(medicalRecordId);

    if (!nextVisitDate) {
      if (existing && (existing.status === FollowUpStatus.PENDING || existing.status === FollowUpStatus.CONFIRMED)) {
        await this.repo.update(existing.id, { status: FollowUpStatus.CANCELLED });
      }
      return;
    }

    if (!existing) {
      await this.repo.create({ petId, medicalRecordId, scheduledDate: nextVisitDate });
      return;
    }

    if (existing.status === FollowUpStatus.COMPLETED) return;

    await this.repo.update(existing.id, {
      scheduledDate: nextVisitDate,
      sevenDayReminded: false,
      dueDayReminded: false,
      ...(existing.status === FollowUpStatus.CANCELLED ? { status: FollowUpStatus.PENDING } : {}),
    });
  }

  async confirm(user: { sub: string; role: UserRole }, id: string) {
    const plan = await this.requireOwnedPlan(user, id);
    assertPlanActive(plan.status as FollowUpStatus);
    return this.repo.update(id, { status: FollowUpStatus.CONFIRMED });
  }

  async reschedule(user: { sub: string; role: UserRole }, id: string, dto: RescheduleFollowUpDto) {
    const plan = await this.requireOwnedPlan(user, id);
    assertPlanActive(plan.status as FollowUpStatus);
    const nextDate = toUtcDay(dto.scheduledDate as string);
    validateLaterDate(plan.scheduledDate, nextDate);
    // 日期顺延后按新日期重新计算两个提醒节点
    return this.repo.update(id, {
      scheduledDate: nextDate,
      sevenDayReminded: false,
      dueDayReminded: false,
    });
  }

  async complete(user: { sub: string; role: UserRole }, id: string) {
    const plan = await this.requireOwnedPlan(user, id);
    assertPlanActive(plan.status as FollowUpStatus);
    return this.repo.update(id, { status: FollowUpStatus.COMPLETED });
  }

  private async requireOwnedPlan(user: { sub: string; role: UserRole }, id: string) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new BusinessException('复诊安排不存在', 40402);
    if (user.role === UserRole.PET_OWNER && plan.pet.ownerId !== user.sub) {
      throw new BusinessException('无权操作该复诊安排', 40303);
    }
    if (user.role === UserRole.VET) {
      throw new BusinessException('仅宠物主人可确认或调整复诊安排', 40304);
    }
    return plan;
  }
}
