export const followUpRoutes = {
  list: 'GET /api/v1/follow-ups',
  nextByPet: 'GET /api/v1/follow-ups/next',
  confirm: 'PATCH /api/v1/follow-ups/:id/confirm',
  reschedule: 'PATCH /api/v1/follow-ups/:id/reschedule',
  complete: 'PATCH /api/v1/follow-ups/:id/complete',
} as const;
