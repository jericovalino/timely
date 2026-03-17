# Timely — Development Plan

**Version:** 1.0
**Date:** 2026-03-16
**Reference:** [BRD.md](./BRD.md)

---

## Phase 0: Foundation & Project Setup

> Establish the monorepo structure, shared packages, and database connection before any feature work begins.

- [x] **0.1** Initialize Turborepo monorepo with npm workspaces
- [x] **0.2** Scaffold `apps/admin` — React 19 + Vite + TailwindCSS v4
- [x] **0.3** Scaffold `apps/kiosk` — React 19 + Vite (minimal)
- [x] **0.4** Scaffold `apps/server` — NestJS with Prisma ORM
- [x] **0.5** Configure shared packages: `@repo/multiverse-ui`, `@repo/app-providers`, `@repo/utilities`, `@repo/hooks`
- [x] **0.6** Configure path aliases (`app`, `hooks`, `assets`, `utilities`, `src`) in all apps
- [x] **0.7** Set port assignments: admin → 5174, kiosk → 5175, server → 3000
- [x] **0.8** Create Neon PostgreSQL project and configure `.env` with `DATABASE_URL`
- [x] **0.9** Set up `turbo.json` pipeline tasks (`dev`, `build`, `lint`, `check-types`, `format`)
- [x] **0.10** Add root-level `package.json` scripts (`dev`, `build`, `lint`, `format`)
- [x] **0.11** Configure CORS on NestJS server to allow admin (5174) and kiosk (5175) origins

---

## Phase 1: Database Schema & Prisma Setup

> Define and migrate the full data model into Neon PostgreSQL.

- [x] **1.1** Write `schema.prisma` — `Department` model
- [x] **1.2** Write `schema.prisma` — `WorkSchedule` model with `workDays String[]`
- [x] **1.3** Write `schema.prisma` — `Employee` model with relations to Department and WorkSchedule
- [x] **1.4** Write `schema.prisma` — `AttendanceLog` model with `ScanType` enum (IN | OUT)
- [x] **1.5** Write `schema.prisma` — `AttendanceRecord` model with `@@unique([employeeId, date])`
- [x] **1.6** Write `schema.prisma` — `User` model (admin accounts)
- [x] **1.7** Run initial Prisma migration (`prisma migrate dev --name init`)
- [x] **1.8** Seed script: create at least one default admin `User` account
- [x] **1.9** Verify all relations and constraints in Neon console

---

## Phase 2: Backend — Authentication

> Protect the admin API with JWT. Kiosk scan endpoint remains public.

- [x] **2.1** Create `AuthModule` with `POST /auth/login` endpoint
- [x] **2.2** Implement password hashing with `bcrypt` on user creation/seed
- [x] **2.3** Issue signed JWT on successful login (include `userId`, `email`, expiry)
- [x] **2.4** Create `JwtAuthGuard` and apply to all protected routes
- [x] **2.5** Configure `SCAN_COOLDOWN_MINUTES` environment variable (default: `120`)
- [x] **2.6** Expose `GET /auth/me` to validate token and return current user info

---

## Phase 3: Backend — Core Resource Modules

> Implement CRUD APIs for Departments, Work Schedules, and Employees.

### Departments (`FR-02`)
- [x] **3.1** `DepartmentModule` — `POST /departments` (create with unique name)
- [x] **3.2** `DepartmentModule` — `GET /departments` (list all)
- [x] **3.3** `DepartmentModule` — `PATCH /departments/:id` (rename)
- [x] **3.4** `DepartmentModule` — `DELETE /departments/:id` (reject if active employees exist)

### Work Schedules (`FR-03`)
- [x] **3.5** `WorkScheduleModule` — `POST /work-schedules`
- [x] **3.6** `WorkScheduleModule` — `GET /work-schedules`
- [x] **3.7** `WorkScheduleModule` — `PATCH /work-schedules/:id`
- [x] **3.8** `WorkScheduleModule` — `DELETE /work-schedules/:id` (reject if employees assigned)

### Employees (`FR-01`)
- [x] **3.9** `EmployeeModule` — `POST /employees` (create with unique `employeeNumber` validation)
- [x] **3.10** `EmployeeModule` — `GET /employees` (paginated, filterable by department, searchable by name/number)
- [x] **3.11** `EmployeeModule` — `GET /employees/:id` (single employee detail)
- [x] **3.12** `EmployeeModule` — `PATCH /employees/:id` (update any field)
- [x] **3.13** `EmployeeModule` — `PATCH /employees/:id/deactivate` (soft-delete, sets `isActive: false`)
- [x] **3.14** Profile photo upload endpoint (store URL in `photoUrl`; use file storage or base64)

---

## Phase 4: Backend — Attendance Scan Logic

> Implement the core attendance recording logic with cooldown enforcement.

- [x] **4.1** `AttendanceModule` — `POST /attendance/scan` (public, no JWT guard)
- [x] **4.2** Scan logic step 1: look up employee by `employeeNumber`; return `NOT_FOUND` if missing or inactive
- [x] **4.3** Scan logic step 2: check for any `AttendanceLog` today for this employee
- [x] **4.4** Scan logic step 3 (no entry today): create `AttendanceLog { type: IN }`, upsert `AttendanceRecord { timeIn }`, return `TIME_IN`
- [x] **4.5** Scan logic step 4 (entry exists, within cooldown): discard, return `ALREADY_RECORDED` with last scan time
- [x] **4.6** Scan logic step 5 (entry exists, outside cooldown): create `AttendanceLog { type: OUT }`, update `AttendanceRecord { timeOut }`, return `TIME_OUT`
- [x] **4.7** Tardiness calculation: compare `timeIn` to `schedule.startTime`; set `isLate`, `lateMinutes`
- [x] **4.8** Undertime calculation: compare `timeOut` to `schedule.endTime`; set `isUndertime`, `undertimeMinutes`
- [x] **4.9** Total hours worked calculation: `(timeOut - timeIn)` in decimal hours; set `totalHoursWorked`
- [x] **4.10** Apply rate limiting to `POST /attendance/scan` (NFR-04)
- [x] **4.11** Log all scan events including ignored/cooldown ones (`FR-07.3`)

---

## Phase 5: Backend — Attendance Admin Endpoints

> Allow administrators to view, filter, and edit attendance records.

- [x] **5.1** `GET /attendance` — paginated list of `AttendanceRecord`, filterable by date range, employee, department, late/undertime flags
- [x] **5.2** `PATCH /attendance/:id` — edit `timeIn` and/or `timeOut`; trigger recalculation of tardiness, undertime, totalHoursWorked; save `adminNote`
- [x] **5.3** `GET /attendance/logs` — read-only list of raw `AttendanceLog` entries (audit view)

---

## Phase 6: Backend — Reports

> Generate the three report types as structured JSON (consumed by frontend for CSV export and print).

- [x] **6.1** `GET /reports/daily-summary?date=YYYY-MM-DD` — all employees with Present/Absent/Late status
- [x] **6.2** `GET /reports/monthly-dtr?employeeId=&year=&month=` — full calendar month DTR for one employee, includes totals row
- [x] **6.3** `GET /reports/late-undertime?from=&to=` — employees with tardiness/undertime in date range, sortable

---

## Phase 7: Admin App — Shell & Auth

> Build the Admin App scaffolding, routing, and login flow.

- [x] **7.1** Set up `@repo/app-providers`: `AuthProvider`, `QueryProvider`, `BrowserRouterProvider` in `apps/admin`
- [x] **7.2** Configure `api.ts` axios instance with `VITE_API_BASE_URL`
- [x] **7.3** Implement `<Public />` route: Login page with `createForm` + Zod schema
- [x] **7.4** Implement `<Private />` route: Sidebar layout using `@repo/multiverse-ui` `Sidebar`
- [x] **7.5** Sidebar navigation items: Employees, Departments, Schedules, Attendance, Reports
- [x] **7.6** Logout flow: clear token from localStorage, redirect to login

---

## Phase 8: Admin App — Employees Module (`FR-01`)

- [x] **8.1** `employees/page.tsx` — paginated `Table` with search input and department filter; deactivate action
- [x] **8.2** `employees/add/page.tsx` — create employee form (`createForm` + Zod) with all fields including photo upload
- [x] **8.3** `employees/[id]/page.tsx` — employee detail page: all fields displayed, edit form
- [x] **8.4** `employees/_hooks/index.ts` — `useEmployeeListQuery`, `useEmployeeDetailQuery`, `useCreateEmployeeMutation`, `useUpdateEmployeeMutation`, `useDeactivateEmployeeMutation`
- [x] **8.5** Show default avatar placeholder when `photoUrl` is null (`FR-01.7`)
- [x] **8.6** Display clear error when `employeeNumber` is duplicate (`FR-01.6`)

---

## Phase 9: Admin App — Departments Module (`FR-02`)

- [x] **9.1** `departments/page.tsx` — list all departments; inline rename; delete (with guard message if employees assigned)
- [x] **9.2** Create department form/modal with unique name validation
- [x] **9.3** `departments/_hooks/index.ts` — `useDepartmentListQuery`, `useCreateDepartmentMutation`, `useUpdateDepartmentMutation`, `useDeleteDepartmentMutation`

---

## Phase 10: Admin App — Work Schedules Module (`FR-03`)

- [x] **10.1** `schedules/page.tsx` — list all schedules; edit and delete actions
- [x] **10.2** Create/edit schedule form: name, start time, end time, working days checkboxes (Mon–Sun)
- [x] **10.3** `schedules/_hooks/index.ts` — `useScheduleListQuery`, `useCreateScheduleMutation`, `useUpdateScheduleMutation`, `useDeleteScheduleMutation`

---

## Phase 11: Admin App — Attendance Module (`FR-04`)

- [x] **11.1** `attendance/page.tsx` — paginated table of `AttendanceRecord` with filters: date range, employee, department, late/undertime flags
- [x] **11.2** Edit modal per record: update `timeIn`, `timeOut`, add `adminNote`; trigger recalculation
- [x] **11.3** `attendance/logs/page.tsx` — read-only raw `AttendanceLog` audit view
- [x] **11.4** `attendance/_hooks/index.ts` — `useAttendanceListQuery`, `useUpdateAttendanceMutation`, `useAttendanceLogListQuery`

---

## Phase 12: Admin App — Reports Module (`FR-05`)

- [x] **12.1** `reports/daily-summary/page.tsx` — date picker, table of employees with status badges; CSV export + print
- [x] **12.2** `reports/monthly-dtr/page.tsx` — employee selector + month/year picker; calendar table with totals row; CSV export + print
- [x] **12.3** `reports/late-undertime/page.tsx` — date range filter; sortable table of tardiness/undertime; CSV export + print
- [x] **12.4** Implement CSV export utility in `@repo/utilities` (or per-page)
- [x] **12.5** Apply print-friendly CSS (`@media print`) to all report pages

---

## Phase 13: Kiosk App (`FR-06`, `FR-07`)

- [x] **13.1** Single-page full-screen layout (no routing, no sidebar, no auth)
- [x] **13.2** **Idle state**: centered prompt text, live date, live digital clock updating every second
- [x] **13.3** Integrate `use-scan-detection` hook to capture USB/HID barcode scanner input
- [x] **13.4** On scan: call `POST /attendance/scan`, show loading indicator
- [x] **13.5** **Feedback state — TIME IN**: employee name, photo, current time, green "TIME IN" badge (4–5 seconds)
- [x] **13.6** **Feedback state — TIME OUT**: employee name, photo, current time, blue "TIME OUT" badge (4–5 seconds)
- [x] **13.7** **Feedback state — ALREADY RECORDED**: orange badge, last scan time shown
- [x] **13.8** **Feedback state — NOT FOUND**: red "Employee not found" message
- [x] **13.9** Auto-dismiss feedback back to idle state after 4–5 seconds (`FR-06.4`)
- [x] **13.10** Profile photo placeholder avatar when `photoUrl` is null
- [x] **13.11** UI legibility check: all text readable from 2–3 meters on ≥1080p display (NFR-06)
- [x] **13.12** Kiosk configured to run in fullscreen/kiosk browser mode (no browser UI visible)

---

## Phase 14: QA, Polish & Deployment

> End-to-end validation, performance testing, and production readiness.

- [x] **14.1** End-to-end scan flow test: scan → TIME IN → ALREADY_RECORDED (cooldown) → NOT_FOUND for invalid IDs
- [x] **14.2** Accidental double-scan test: scan twice within cooldown → second returns ALREADY_RECORDED
- [x] **14.3** Admin portal: verified CRUD for Employee, Department, Schedule via API
- [ ] **14.4** Admin portal: verify attendance record edit triggers correct recalculation
- [ ] **14.5** Reports: verify CSV export output matches displayed data
- [ ] **14.6** Reports: verify print layout is clean and page-break friendly
- [ ] **14.7** Performance: kiosk scan round-trip under 1 second on local network (NFR-01)
- [x] **14.8** Security: scan endpoint returns NOT_FOUND for non-existent employees; 401 on protected routes without token
- [x] **14.9** JWT auth verified — login returns token, /me validates it, 401 on missing token
- [x] **14.10** Set up PM2 for server auto-restart (NFR-03) — `ecosystem.config.js` created
- [x] **14.11** Configure `SCAN_COOLDOWN_MINUTES` and `DATABASE_URL` in production environment — `.env.production.example` created
- [ ] **14.12** Verify kiosk browser auto-launches fullscreen after system reboot
- [x] **14.13** Health check endpoint `GET /health` — returns `{ status: 'ok', timestamp }`
- [x] **14.14** `SETUP.md` and `KIOSK_SETUP.md` deployment documentation created
- [x] **14.15** Neon DB keepalive cron (every 5 minutes) to prevent auto-suspend cold starts

---

## Progress Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Foundation & Project Setup | ✅ Complete |
| 1 | Database Schema & Prisma | ✅ Complete |
| 2 | Backend — Authentication | ✅ Complete |
| 3 | Backend — Core Resource Modules | ✅ Complete |
| 4 | Backend — Attendance Scan Logic | ✅ Complete |
| 5 | Backend — Attendance Admin Endpoints | ✅ Complete |
| 6 | Backend — Reports | ✅ Complete |
| 7 | Admin App — Shell & Auth | ✅ Complete |
| 8 | Admin App — Employees | ✅ Complete |
| 9 | Admin App — Departments | ✅ Complete |
| 10 | Admin App — Work Schedules | ✅ Complete |
| 11 | Admin App — Attendance | ✅ Complete |
| 12 | Admin App — Reports | ✅ Complete |
| 13 | Kiosk App | ✅ Complete |
| 14 | QA, Polish & Deployment | 🔄 In Progress |
