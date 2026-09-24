import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FollowUpStatus } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: string }, petId?: string, activeOnly = false) {
    const where: Prisma.FollowUpPlanWhereInput = {
      ...(user.role === 'PET_OWNER' ? { pet: { ownerId: user.sub } } : {}),
      ...(user.role === 'VET' ? { medicalRecord: { vetId: user.sub } } : {}),
      ...(petId ? { petId } : {}),
      ...(activeOnly ? { status: { in: [FollowUpStatus.PENDING, FollowUpStatus.CONFIRMED] } } : {}),
    };
    return this.prisma.followUpPlan.findMany({
      where,
      include: { pet: true, medicalRecord: { include: { clinic: true, vet: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.followUpPlan.findUnique({
      where: { id },
      include: { pet: true, medicalRecord: true },
    });
  }

  findNextByPet(petId: string) {
    return this.prisma.followUpPlan.findFirst({
      where: { petId, status: { in: [FollowUpStatus.PENDING, FollowUpStatus.CONFIRMED] } },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  findByMedicalRecord(medicalRecordId: string) {
    return this.prisma.followUpPlan.findUnique({ where: { medicalRecordId } });
  }

  create(data: Prisma.FollowUpPlanUncheckedCreateInput) {
    return this.prisma.followUpPlan.create({ data });
  }

  update(id: string, data: Prisma.FollowUpPlanUncheckedUpdateInput) {
    return this.prisma.followUpPlan.update({ where: { id }, data });
  }

  private activeStatuses() {
    const statuses: FollowUpStatus[] = [FollowUpStatus.PENDING, FollowUpStatus.CONFIRMED];
    return { in: statuses };
  }

  /** 临近 7 天窗口内、尚未发送过 7 天提醒的待复诊安排 */
  findSevenDayCandidates(from: Date, to: Date) {
    return this.prisma.followUpPlan.findMany({
      where: {
        status: this.activeStatuses(),
        sevenDayReminded: false,
        scheduledDate: { gte: from, lte: to },
      },
      include: { pet: true, medicalRecord: true },
    });
  }

  /** 到期当天、尚未发送过到期提醒的待复诊安排 */
  findDueDayCandidates(from: Date, to: Date) {
    return this.prisma.followUpPlan.findMany({
      where: {
        status: this.activeStatuses(),
        dueDayReminded: false,
        scheduledDate: { gte: from, lte: to },
      },
      include: { pet: true, medicalRecord: true },
    });
  }
}
