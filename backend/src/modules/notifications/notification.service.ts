import { Injectable } from '@nestjs/common';
import { FollowUpStatus } from '../../constants/enums';
import { addDays, startOfDay } from '../../utils/date';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

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

    // 复诊提醒：临近七天和到期当天各提醒一次，已完成/已撤下的安排不再提醒
    const followUps = await this.prisma.followUpPlan.findMany({
      where: { status: { in: [FollowUpStatus.PENDING, FollowUpStatus.CONFIRMED] } },
      include: { pet: true },
    });
    const today = startOfDay(now);
    for (const plan of followUps) {
      const dueDay = startOfDay(plan.dueDate);
      const dueText = dueDay.toISOString().slice(0, 10);
      if (!plan.remindedAtDue && today.getTime() >= dueDay.getTime()) {
        await this.prisma.notification.create({
          data: {
            userId: plan.pet.ownerId,
            title: '复诊到期提醒',
            content: `${plan.pet.name} 的复诊日期是今天（${dueText}），请按时就诊`,
            type: 'FOLLOW_UP',
          },
        }).catch(() => undefined);
        await this.prisma.followUpPlan.update({ where: { id: plan.id }, data: { remindedAtDue: now } });
      } else if (!plan.remindedAt7d && now.getTime() >= addDays(plan.dueDate, -7).getTime()) {
        await this.prisma.notification.create({
          data: {
            userId: plan.pet.ownerId,
            title: '复诊临近提醒',
            content: `${plan.pet.name} 的复诊日期临近（${dueText}），请提前安排时间`,
            type: 'FOLLOW_UP',
          },
        }).catch(() => undefined);
        await this.prisma.followUpPlan.update({ where: { id: plan.id }, data: { remindedAt7d: now } });
      }
    }
  }
}
