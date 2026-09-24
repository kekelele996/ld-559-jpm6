import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLog } from '../../middleware/audit-log';
import { AuthGuard } from '../auth/auth.guard';
import { RescheduleFollowUpDto } from './followup.dto';
import { FollowUpService } from './followup.service';

@Controller('follow-ups')
@UseGuards(AuthGuard)
export class FollowUpController {
  constructor(private readonly service: FollowUpService) {}

  @Get()
  async list(@Req() req: any, @Query('petId') petId?: string) {
    return { code: 0, message: 'ok', data: await this.service.list(req.user, petId) };
  }

  @Patch(':id/confirm')
  @AuditLog('确认复诊预约')
  async confirm(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.confirm(id, req.user) };
  }

  @Patch(':id/reschedule')
  @AuditLog('改期复诊安排')
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleFollowUpDto, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.reschedule(id, dto, req.user) };
  }

  @Patch(':id/complete')
  @AuditLog('完成复诊安排')
  async complete(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.complete(id, req.user) };
  }
}
