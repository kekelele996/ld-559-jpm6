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
  async list(
    @Req() req: any,
    @Query('petId') petId?: string,
    @Query('active') active?: string,
  ) {
    const data = await this.service.list(req.user, petId, active === 'true');
    return { code: 0, message: 'ok', data };
  }

  @Get('next')
  async next(@Req() req: any, @Query('petId') petId: string) {
    return { code: 0, message: 'ok', data: await this.service.next(req.user, petId) };
  }

  @Patch(':id/confirm')
  @AuditLog('确认复诊预约')
  async confirm(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.confirm(req.user, id) };
  }

  @Patch(':id/reschedule')
  @AuditLog('顺延复诊日期')
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleFollowUpDto, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.reschedule(req.user, id, dto) };
  }

  @Patch(':id/complete')
  @AuditLog('复诊标记完成')
  async complete(@Param('id') id: string, @Req() req: any) {
    return { code: 0, message: 'ok', data: await this.service.complete(req.user, id) };
  }
}
