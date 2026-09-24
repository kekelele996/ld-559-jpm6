import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: UserRole }, petId?: string) {
    const where: Prisma.FollowUpPlanWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(user.role === UserRole.VET ? { medicalRecord: { vetId: user.sub } } : {}),
      ...(petId ? { petId } : {}),
    };
    return this.prisma.followUpPlan.findMany({ where, include: { pet: true, medicalRecord: true }, orderBy: { dueDate: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.followUpPlan.findUnique({ where: { id }, include: { pet: true } });
  }

  findByMedicalRecordId(medicalRecordId: string) {
    return this.prisma.followUpPlan.findUnique({ where: { medicalRecordId } });
  }

  create(data: Prisma.FollowUpPlanUncheckedCreateInput) {
    return this.prisma.followUpPlan.create({ data });
  }

  update(id: string, data: Prisma.FollowUpPlanUncheckedUpdateInput) {
    return this.prisma.followUpPlan.update({ where: { id }, data });
  }
}
