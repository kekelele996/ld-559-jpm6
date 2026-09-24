import { Injectable } from '@nestjs/common';
import { addDays } from '../../utils/date';
import { PrismaService } from '../../prisma/prisma.service';
import { FollowUpRepository } from '../followups/followup.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followUpRepo: FollowUpRepository,
  ) {}

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async scanAndCreateReminders() {
    const now = new Date();

    const vaccineDue = await this.prisma.vaccineRecord.findMany({
      where: { nextDueDate: { gte: now, lte: addDays(now, 7) } },
      include: { pet: true },
    });
    for (const item of vaccineDue) {
      await this.prisma.notification.create({
        data: {
          userId: item.pet.ownerId,
          title: '疫苗即将到期',
          content: `${item.pet.name} 的 ${item.vaccineName} 需要续种`,
          type: 'VACCINE',
        },
      }).catch(() => undefined);
    }

    const policies = await this.prisma.insurancePolicy.findMany({
      where: { endDate: { gte: now, lte: addDays(now, 30) } },
      include: { pet: true },
    });
    for (const policy of policies) {
      await this.prisma.notification.create({
        data: {
          userId: policy.pet.ownerId,
          title: '保单即将续保',
          content: `${policy.pet.name} 的 ${policy.provider} 保单即将到期`,
          type: 'INSURANCE',
        },
      }).catch(() => undefined);
    }

    await this.scanFollowUpReminders(now);
  }

  /** 复诊临近 7 天与到期当天各提醒一次，已完成 / 已撤下的安排不再提醒 */
  private async scanFollowUpReminders(now: Date) {
    // 未来第 1~7 天到期的计划发送"临近"提醒；今天到期走"当天"提醒，两者窗口不重叠
    const sevenDayPlans = await this.followUpRepo.findSevenDayCandidates(
      utcStartOfDay(utcDayOffset(now, 1)),
      utcEndOfDay(utcDayOffset(now, 7)),
    );
    for (const plan of sevenDayPlans) {
      await this.prisma.notification.create({
        data: {
          userId: plan.pet.ownerId,
          title: '复诊临近提醒',
          content: `${plan.pet.name} 将于 ${formatUtcDay(plan.scheduledDate)} 复诊，请提前安排时间`,
          type: 'FOLLOW_UP',
        },
      });
      await this.followUpRepo.update(plan.id, { sevenDayReminded: true });
    }

    const today = utcDayOffset(now, 0);
    const duePlans = await this.followUpRepo.findDueDayCandidates(
      utcStartOfDay(today),
      utcEndOfDay(today),
    );
    for (const plan of duePlans) {
      await this.prisma.notification.create({
        data: {
          userId: plan.pet.ownerId,
          title: '复诊今日到期',
          content: `${plan.pet.name} 今天需要复诊，别忘了按时前往`,
          type: 'FOLLOW_UP',
        },
      });
      await this.followUpRepo.update(plan.id, { dueDayReminded: true });
    }
  }
}

function utcDayOffset(date: Date, offset: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offset));
}

function utcStartOfDay(day: Date) {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0));
}

function utcEndOfDay(day: Date) {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999));
}

function formatUtcDay(day: Date) {
  return `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
}
