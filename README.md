# PetCare+ 宠物医疗与保险管理平台

```bash
cp .env.example .env
docker compose up -d
```

本地开发：

```bash
cd backend && npm install && npm run prisma:generate && npm run start:dev
cd frontend && npm install && npm run dev
```

访问地址：
- 前端：http://localhost:38408
- 后端 API：http://localhost:38506/api/v1
- 健康检查：http://localhost:38506/api/v1/health

PetCare+ 是面向宠物主人、兽医和管理员的一站式宠物健康管理平台，覆盖宠物档案、就诊记录、**复诊跟踪**、疫苗接种计划、保险保单和提醒通知。

## 复诊跟踪

医生在就诊记录中填写/修改「下次复诊日期」后，系统会自动为该宠物生成或顺延一条待复诊计划（`FollowUpPlan`，与就诊记录一对一，同一份记录不会重复出现）；医生清空复诊日期时，未完成的待办同步撤下，已完成的保留为历史。主人在「宠物详情 → 复诊安排」中可以：

- 查看下一次复诊日期、倒计时与下一次提醒节点（到期前 7 天、到期当天各一次）
- 确认预约、把复诊改到**更晚**日期（改期后按新日期重新提醒）、标记完成
- 已完成 / 已撤下的安排不再提醒

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite、Ant Design 5 |
| 状态 | React Query、Zustand |
| 图表 | ECharts、echarts-for-react |
| 后端 | NestJS、TypeScript、Prisma |
| 数据库 | PostgreSQL |
| 认证 | JWT、角色守卫 |
| 部署 | Docker Compose、Nginx |

## 功能页面

| 页面 | 功能 |
|---|---|
| `/login` | 演示账号登录 |
| `/pets` | 宠物卡片、搜索、物种筛选 |
| `/pets/:id` | 基本信息、就诊时间线、复诊安排、疫苗日历、保单列表 |
| `/medical` | 就诊记录表格、处方侧栏、费用柱状图 |
| `/vaccines` | 疫苗日历、待接种提醒、状态标记 |
| `/insurance` | 保单卡片、理赔流程、保费/保障分析 |

## 核心实体贯穿链路

| 实体 | 后端链路 | 前端链路 |
|---|---|---|
| Pet | `prisma/schema.prisma` → `prisma.service.ts` → `pet.repository.ts` → `pet.service.ts` → `pet.controller.ts` → `pet.routes.ts` | `petApi.ts` → `usePets.ts` → `PetList.tsx` / `PetDetail.tsx` / `PetAvatar.tsx` |
| MedicalRecord | Prisma → `medical.repository.ts` → `medical.service.ts`（同步复诊计划）→ `medical.controller.ts` → `medical.routes.ts` | `medicalApi.ts` → `usePets.ts` → `MedicalManagement.tsx` / `CostBarChart.tsx` |
| FollowUpPlan | Prisma → `followup.repository.ts` → `followup.service.ts` → `followup.controller.ts` → `followup.routes.ts` | `followUpApi.ts` → `useFollowUps.ts` → `FollowUpNextCard.tsx` / `FollowUpList.tsx`（`PetDetail.tsx`） |
| VaccineRecord | Prisma → `vaccine.repository.ts` → `vaccine.service.ts` → `vaccine.controller.ts` → `vaccine.routes.ts` | `vaccineApi.ts` → `usePets.ts` → `VaccineManagement.tsx` / `VaccineCalendar.tsx` |
| InsurancePolicy | Prisma → `insurance.repository.ts` → `insurance.service.ts` → `insurance.controller.ts` → `insurance.routes.ts` | `insuranceApi.ts` → `usePets.ts` → `InsuranceCenter.tsx` / `InsurancePieChart.tsx` |

## 枚举定义与使用位置

| 枚举 | 后端定义与使用 | 前端定义与使用 |
|---|---|---|
| UserRole | `backend/src/constants/enums.ts`、`auth.guard.ts`、`roles.guard.ts`、`auth.service.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`authStore.ts`、`Login.tsx`、`AuthGuard.tsx` |
| PetSpecies | `backend/src/constants/enums.ts`、`pet.dto.ts`、`pet.repository.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetList.tsx`、`PetAvatar.tsx`、`mockData.ts` |
| VisitType | `backend/src/constants/enums.ts`、`medical.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`medical.d.ts`、`MedicalManagement.tsx`、`mockData.ts` |
| VaccineStatus | `backend/src/constants/enums.ts`、`vaccine.dto.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`vaccine.d.ts`、`VaccineManagement.tsx`、`VaccineCalendar.tsx`、`StatusBadge.tsx` |
| InsuranceStatus | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`notification.scheduler.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`InsurancePieChart.tsx`、`StatusBadge.tsx` |
| PolicyType | `backend/src/constants/enums.ts`、`insurance.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`insurance.d.ts`、`InsuranceCenter.tsx`、`mockData.ts` |
| Gender | `backend/src/constants/enums.ts`、`pet.dto.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`pet.d.ts`、`PetDetail.tsx`、`mockData.ts` |
| FollowUpStatus | `backend/src/constants/enums.ts`、`followup.service.ts`、`followup.repository.ts`、`followup.validator.ts`、`notification.service.ts`、`schema.prisma` | `frontend/src/constants/enums.ts`、`followup.d.ts`、`FollowUpNextCard.tsx`、`FollowUpList.tsx`、`StatusBadge.tsx`、`mockData.ts` |

## RBAC

| 角色 | 数据范围 | 主要能力 |
|---|---|---|
| PET_OWNER | 仅自己的宠物和关联数据 | 查看宠物、病历、疫苗、保单 |
| VET | 分配给自己的就诊/疫苗数据 | 创建和维护医疗记录 |
| ADMIN | 全部数据 | 平台管理、审计查看 |

## 全局异常处理

后端 `backend/src/middleware/error-handler.ts` 统一捕获业务异常和系统异常，返回 `{ code, message, data }`。前端 `frontend/src/utils/request.ts` 统一处理 HTTP 错误和业务错误，使用 Ant Design `message.error()` 提示，401 自动跳转登录页。

## 操作日志

后端 `backend/src/middleware/audit-log.ts` 提供 `@AuditLog('描述')` 装饰器和拦截器，记录创建就诊记录、疫苗接种、投保、理赔、添加宠物等写操作，字段包括请求路径、方法、操作人、请求体摘要、状态码和时间。

## 提醒通知

`backend/src/modules/notifications/notification.scheduler.ts` 每天 8:00 扫描疫苗到期、保险续保和复诊提醒，前端 `NotificationBell.tsx` 拉取未读通知。复诊提醒规则：

- 计划复诊日前 **7 天**提醒一次、到期**当天**提醒一次，通过 `FollowUpPlan.sevenDayReminded` / `dueDayReminded` 标记位去重，每天扫描也不会重复发送
- 仅 `PENDING` / `CONFIRMED` 状态参与扫描，`COMPLETED`（已完成）、`CANCELLED`（已撤下）不再提醒
- 医生修改复诊日期或主人改期后，提醒标记重置，按新日期重新计算

## 目录结构

```text
frontend/
├── src/api/
├── src/components/common/
├── src/components/followups/
├── src/components/charts/
├── src/constants/
├── src/hooks/
├── src/pages/
├── src/stores/
├── src/types/
├── src/utils/
├── src/guards/
├── App.tsx
└── main.tsx

backend/
├── src/modules/pets/
├── src/modules/medical/
├── src/modules/followups/
├── src/modules/vaccines/
├── src/modules/insurance/
├── src/modules/auth/
├── src/modules/notifications/
├── src/prisma/prisma.service.ts
├── src/constants/enums.ts
├── src/middleware/
├── src/exceptions/
├── src/main.ts
└── src/app.module.ts

database/
└── seed.ts
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `COMPOSE_PROJECT_NAME` | Docker Compose 名称，默认 `ldpetcare` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_ROOT_PASSWORD` | 数据库配置 |
| `DATABASE_URL` | Prisma PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 密钥 |
| `FRONTEND_PORT` | 默认 `38408` |
| `BACKEND_PORT` | 默认 `38506` |

## Docker

`docker-compose.yml` 顶层声明 `name: ldpetcare`，无 `version:` 字段。前端 Nginx 将 `/api/` 反向代理到 `backend:38506`，并配置 `try_files $uri $uri/ /index.html` 支持 SPA 路由和 WebSocket Upgrade 头。

## License

MIT
