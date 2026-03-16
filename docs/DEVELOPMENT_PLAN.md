# Timely — Development Plan

**Version:** 1.0
**Date:** 2026-03-16
**Reference:** [BRD.md](./BRD.md)

---

## Phase 0: Foundation & Project Setup

> Establish the monorepo structure, shared packages, and database connection before any feature work begins.

- [ ] **0.1** Initialize Turborepo monorepo with npm workspaces
- [ ] **0.2** Scaffold `apps/admin` — React 19 + Vite + TailwindCSS v4
- [ ] **0.3** Scaffold `apps/kiosk` — React 19 + Vite (minimal)
- [ ] **0.4** Scaffold `apps/server` — NestJS with Prisma ORM
- [ ] **0.5** Configure shared packages: `@repo/multiverse-ui`, `@repo/app-providers`, `@repo/utilities`, `@repo/hooks`
- [ ] **0.6** Configure path aliases (`app`, `hooks`, `assets`, `utilities`, `src`) in all apps
- [ ] **0.7** Set port assignments: admin → 5174, kiosk → 5175, server → 3000
- [ ] **0.8** Create Neon PostgreSQL project and configure `.env` with `DATABASE_URL`
- [ ] **0.9** Set up `turbo.json` pipeline tasks (`dev`, `build`, `lint`, `check-types`, `format`)
- [ ] **0.10** Add root-level `package.json` scripts (`dev`, `build`, `lint`, `format`)
- [ ] **0.11** Configure CORS on NestJS server to allow admin (5174) and kiosk (5175) origins

---

## Phase 1: Database Schema & Prisma Setup

> Define and migrate the full data model into Neon PostgreSQL.

- [ ] **1.1** Write `schema.prisma` — `Department` model
- [ ] **1.2** Write `schema.prisma` — `WorkSchedule` model with `workDays String[]`
- [ ] **1.3** Write `schema.prisma` — `Employee` model with relations to Department and WorkSchedule
- [ ] **1.4** Write `schema.prisma` — `AttendanceLog` model with `ScanType` enum (IN | OUT)
- [ ] **1.5** Write `schema.prisma` — `AttendanceRecord` model with `@@unique([employeeId, date])`
- [ ] **1.6** Write `schema.prisma` — `User` model (admin accounts)
- [ ] **1.7** Run initial Prisma migration (`prisma migrate dev --name init`)
- [ ] **1.8** Seed script: create at least one default admin `User` account
- [ ] **1.9** Verify all relations and constraints in Neon console

---

## Phase 2: Backend — Authentication

> Protect the admin API with JWT. Kiosk scan endpoint remains public.

- [ ] **2.1** Create `AuthModule` with `POST /auth/login` endpoint
- [ ] **2.2** Implement password hashing with `bcrypt` on user creation/seed
- [ ] **2.3** Issue signed JWT on successful login (include `userId`, `email`, expiry)
- [ ] **2.4** Create `JwtAuthGuard` and apply to all protected routes
- [ ] **2.5** Configure `SCAN_COOLDOWN_MINUTES` environment variable (default: `120`)
- [ ] **2.6** Expose `GET /auth/me` to validate token and return current user info

---

## Phase 3: Backend — Core Resource Modules

> Implement CRUD APIs for Departments, Work Schedules, and Employees.

### Departments (`FR-02`)
- [ ] **3.1** `DepartmentModule` — `POST /departments` (create with unique name)
- [ ] **3.2** `DepartmentModule` — `GET /departments` (list all)
- [ ] **3.3** `DepartmentModule` — `PATCH /departments/:id` (rename)
- [ ] **3.4** `DepartmentModule` — `DELETE /departments/:id` (reject if active employees exist)

### Work Schedules (`FR-03`)
- [ ] **3.5** `WorkScheduleModule` — `POST /work-schedules`
- [ ] **3.6** `WorkScheduleModule` — `GET /work-schedules`
- [ ] **3.7** `WorkScheduleModule` — `PATCH /work-schedules/:id`
- [ ] **3.8** `WorkScheduleModule` — `DELETE /work-schedules/:id` (reject if employees assigned)

### Employees (`FR-01`)
- [ ] **3.9** `EmployeeModule` — `POST /employees` (create with unique `employeeNumber` validation)
- [ ] **3.10** `EmployeeModule` — `GET /employees` (paginated, filterable by department, searchable by name/number)
- [ ] **3.11** `EmployeeModule` — `GET /employees/:id` (single employee detail)
- [ ] **3.12** `EmployeeModule` — `PATCH /employees/:id` (update any field)
- [ ] **3.13** `EmployeeModule` — `PATCH /employees/:id/deactivate` (soft-delete, sets `isActive: false`)
- [ ] **3.14** Profile photo upload endpoint (store URL in `photoUrl`; use file storage or base64)

---

## Phase 4: Backend — Attendance Scan Logic

> Implement the core attendance recording logic with cooldown enforcement.

- [ ] **4.1** `AttendanceModule` — `POST /attendance/scan` (public, no JWT guard)
- [ ] **4.2** Scan logic step 1: look up employee by `employeeNumber`; return `NOT_FOUND` if missing or inactive
- [ ] **4.3** Scan logic step 2: check for any `AttendanceLog` today for this employee
- [ ] **4.4** Scan logic step 3 (no entry today): create `AttendanceLog { type: IN }`, upsert `AttendanceRecord { timeIn }`, return `TIME_IN`
- [ ] **4.5** Scan logic step 4 (entry exists, within cooldown): discard, return `ALREADY_RECORDED` with last scan time
- [ ] **4.6** Scan logic step 5 (entry exists, outside cooldown): create `AttendanceLog { type: OUT }`, update `AttendanceRecord { timeOut }`, return `TIME_OUT`
- [ ] **4.7** Tardiness calculation: compare `timeIn` to `schedule.startTime`; set `isLate`, `lateMinutes`
- [ ] **4.8** Undertime calculation: compare `timeOut` to `schedule.endTime`; set `isUndertime`, `undertimeMinutes`
- [ ] **4.9** Total hours worked calculation: `(timeOut - timeIn)` in decimal hours; set `totalHoursWorked`
- [ ] **4.10** Apply rate limiting to `POST /attendance/scan` (NFR-04)
- [ ] **4.11** Log all scan events including ignored/cooldown ones (`FR-07.3`)

---

## Phase 5: Backend — Attendance Admin Endpoints

> Allow administrators to view, filter, and edit attendance records.

- [ ] **5.1** `GET /attendance` — paginated list of `AttendanceRecord`, filterable by date range, employee, department, late/undertime flags
- [ ] **5.2** `PATCH /attendance/:id` — edit `timeIn` and/or `timeOut`; trigger recalculation of tardiness, undertime, totalHoursWorked; save `adminNote`
- [ ] **5.3** `GET /attendance/logs` — read-only list of raw `AttendanceLog` entries (audit view)

---

## Phase 6: Backend — Reports

> Generate the three report types as structured JSON (consumed by frontend for CSV export and print).

- [ ] **6.1** `GET /reports/daily-summary?date=YYYY-MM-DD` — all employees with Present/Absent/Late status
- [ ] **6.2** `GET /reports/monthly-dtr?employeeId=&year=&month=` — full calendar month DTR for one employee, includes totals row
- [ ] **6.3** `GET /reports/late-undertime?from=&to=` — employees with tardiness/undertime in date range, sortable

---

## Phase 7: Admin App — Shell & Auth

> Build the Admin App scaffolding, routing, and login flow.

- [ ] **7.1** Set up `@repo/app-providers`: `AuthProvider`, `QueryProvider`, `BrowserRouterProvider` in `apps/admin`
- [ ] **7.2** Configure `api.ts` axios instance with `VITE_API_BASE_URL`
- [ ] **7.3** Implement `<Public />` route: Login page with `createForm` + Zod schema
- [ ] **7.4** Implement `<Private />` route: Sidebar layout using `@repo/multiverse-ui` `Sidebar`
- [ ] **7.5** Sidebar navigation items: Employees, Departments, Schedules, Attendance, Reports
- [ ] **7.6** Logout flow: clear token from localStorage, redirect to login

---

## Phase 8: Admin App — Employees Module (`FR-01`)

- [ ] **8.1** `employees/page.tsx` — paginated `Table` with search input and department filter; deactivate action
- [ ] **8.2** `employees/add/page.tsx` — create employee form (`createForm` + Zod) with all fields including photo upload
- [ ] **8.3** `employees/[id]/page.tsx` — employee detail page: all fields displayed, edit form
- [ ] **8.4** `employees/_hooks/index.ts` — `useEmployeeListQuery`, `useEmployeeDetailQuery`, `useCreateEmployeeMutation`, `useUpdateEmployeeMutation`, `useDeactivateEmployeeMutation`
- [ ] **8.5** Show default avatar placeholder when `photoUrl` is null (`FR-01.7`)
- [ ] **8.6** Display clear error when `employeeNumber` is duplicate (`FR-01.6`)

---

## Phase 9: Admin App — Departments Module (`FR-02`)

- [ ] **9.1** `departments/page.tsx` — list all departments; inline rename; delete (with guard message if employees assigned)
- [ ] **9.2** Create department form/modal with unique name validation
- [ ] **9.3** `departments/_hooks/index.ts` — `useDepartmentListQuery`, `useCreateDepartmentMutation`, `useUpdateDepartmentMutation`, `useDeleteDepartmentMutation`

---

## Phase 10: Admin App — Work Schedules Module (`FR-03`)

- [ ] **10.1** `schedules/page.tsx` — list all schedules; edit and delete actions
- [ ] **10.2** Create/edit schedule form: name, start time, end time, working days checkboxes (Mon–Sun)
- [ ] **10.3** `schedules/_hooks/index.ts` — `useScheduleListQuery`, `useCreateScheduleMutation`, `useUpdateScheduleMutation`, `useDeleteScheduleMutation`

---

## Phase 11: Admin App — Attendance Module (`FR-04`)

- [ ] **11.1** `attendance/page.tsx` — paginated table of `AttendanceRecord` with filters: date range, employee, department, late/undertime flags
- [ ] **11.2** Edit modal per record: update `timeIn`, `timeOut`, add `adminNote`; trigger recalculation
- [ ] **11.3** `attendance/logs/page.tsx` — read-only raw `AttendanceLog` audit view
- [ ] **11.4** `attendance/_hooks/index.ts` — `useAttendanceListQuery`, `useUpdateAttendanceMutation`, `useAttendanceLogListQuery`

---

## Phase 12: Admin App — Reports Module (`FR-05`)

- [ ] **12.1** `reports/daily-summary/page.tsx` — date picker, table of employees with status badges; CSV export + print
- [ ] **12.2** `reports/monthly-dtr/page.tsx` — employee selector + month/year picker; calendar table with totals row; CSV export + print
- [ ] **12.3** `reports/late-undertime/page.tsx` — date range filter; sortable table of tardiness/undertime; CSV export + print
- [ ] **12.4** Implement CSV export utility in `@repo/utilities` (or per-page)
- [ ] **12.5** Apply print-friendly CSS (`@media print`) to all report pages

---

## Phase 13: Kiosk App (`FR-06`, `FR-07`)

- [ ] **13.1** Single-page full-screen layout (no routing, no sidebar, no auth)
- [ ] **13.2** **Idle state**: centered prompt text, live date, live digital clock updating every second
- [ ] **13.3** Integrate `use-scan-detection` hook to capture USB/HID barcode scanner input
- [ ] **13.4** On scan: call `POST /attendance/scan`, show loading indicator
- [ ] **13.5** **Feedback state — TIME IN**: employee name, photo, current time, green "TIME IN" badge (4–5 seconds)
- [ ] **13.6** **Feedback state — TIME OUT**: employee name, photo, current time, blue "TIME OUT" badge (4–5 seconds)
- [ ] **13.7** **Feedback state — ALREADY RECORDED**: orange badge, last scan time shown
- [ ] **13.8** **Feedback state — NOT FOUND**: red "Employee not found" message
- [ ] **13.9** Auto-dismiss feedback back to idle state after 4–5 seconds (`FR-06.4`)
- [ ] **13.10** Profile photo placeholder avatar when `photoUrl` is null
- [ ] **13.11** UI legibility check: all text readable from 2–3 meters on ≥1080p display (NFR-06)
- [ ] **13.12** Kiosk configured to run in fullscreen/kiosk browser mode (no browser UI visible)

---

## Phase 14: QA, Polish & Deployment

> End-to-end validation, performance testing, and production readiness.

- [ ] **14.1** End-to-end scan flow test: scan → TIME IN → wait cooldown → scan → TIME OUT
- [ ] **14.2** Accidental double-scan test: scan twice within 30 seconds → second returns ALREADY_RECORDED
- [ ] **14.3** Admin portal: verify all CRUD operations for Employee, Department, Schedule
- [ ] **14.4** Admin portal: verify attendance record edit triggers correct recalculation
- [ ] **14.5** Reports: verify CSV export output matches displayed data
- [ ] **14.6** Reports: verify print layout is clean and page-break friendly
- [ ] **14.7** Performance: kiosk scan round-trip under 1 second on local network (NFR-01)
- [ ] **14.8** Security: confirm kiosk scan endpoint rejects non-existent employee numbers and is rate-limited
- [ ] **14.9** Confirm JWT expiry and logout redirect work correctly
- [ ] **14.10** Set up PM2 or Docker for server auto-restart (NFR-03)
- [ ] **14.11** Configure `SCAN_COOLDOWN_MINUTES` and `DATABASE_URL` in production environment
- [ ] **14.12** Verify kiosk browser auto-launches fullscreen after system reboot

---

## Progress Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Foundation & Project Setup | ⬜ Not started |
| 1 | Database Schema & Prisma | ⬜ Not started |
| 2 | Backend — Authentication | ⬜ Not started |
| 3 | Backend — Core Resource Modules | ⬜ Not started |
| 4 | Backend — Attendance Scan Logic | ⬜ Not started |
| 5 | Backend — Attendance Admin Endpoints | ⬜ Not started |
| 6 | Backend — Reports | ⬜ Not started |
| 7 | Admin App — Shell & Auth | ⬜ Not started |
| 8 | Admin App — Employees | ⬜ Not started |
| 9 | Admin App — Departments | ⬜ Not started |
| 10 | Admin App — Work Schedules | ⬜ Not started |
| 11 | Admin App — Attendance | ⬜ Not started |
| 12 | Admin App — Reports | ⬜ Not started |
| 13 | Kiosk App | ⬜ Not started |
| 14 | QA, Polish & Deployment | ⬜ Not started |
