# Business Requirements Document (BRD)
## Timely — Daily Time Record (DTR) System

**Version:** 1.0
**Date:** 2026-03-16
**Status:** Draft — Pending Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Stakeholders & Users](#3-stakeholders--users)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Functional Requirements](#5-functional-requirements)
   - [FR-01: Employee Management](#fr-01-employee-management)
   - [FR-02: Department Management](#fr-02-department-management)
   - [FR-03: Work Schedule Management](#fr-03-work-schedule-management)
   - [FR-04: Attendance Viewing & Editing](#fr-04-attendance-viewing--editing)
   - [FR-05: Reports](#fr-05-reports)
   - [FR-06: Barcode Scan Interface (Kiosk)](#fr-06-barcode-scan-interface-kiosk)
   - [FR-07: Accidental Scan Prevention](#fr-07-accidental-scan-prevention)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Stack & Architecture](#7-technical-stack--architecture)
8. [Data Model](#8-data-model)
9. [UI/UX Notes](#9-uiux-notes)
10. [Barcode Scanning Research Summary](#10-barcode-scanning-research-summary)
11. [Out of Scope](#11-out-of-scope)
12. [Assumptions & Constraints](#12-assumptions--constraints)
13. [Glossary](#13-glossary)

---

## 1. Executive Summary

**Timely** is a Digital Time Record (DTR) system designed to modernize and automate employee attendance tracking for a single-location organization. The system replaces manual logbooks or paper-based timesheets with a barcode-driven kiosk and a web-based administration portal.

Employees scan their ID barcode at an always-on kiosk terminal to record time-in and time-out events. Administrators access a secure management portal to monitor attendance, manage employees and schedules, correct records, and generate reports.

The system is built as a Turborepo monorepo on a modern web stack (React 19, NestJS, Prisma, Neon PostgreSQL) and follows the established architectural patterns of the existing codebase.

---

## 2. Project Overview

| Item | Detail |
|------|--------|
| **Project Name** | Timely |
| **Type** | Internal HR / Attendance System |
| **Deployment** | Single location |
| **Primary Input** | Barcode scanner (USB/HID) |
| **Primary Output** | Attendance logs, tardiness reports, monthly DTR |

### Goals

- Automate Time In / Time Out recording via barcode scan
- Eliminate manual timekeeping errors
- Provide administrators with real-time attendance visibility
- Generate accurate tardiness, undertime, and hours-worked reports
- Be simple and reliable enough for non-technical staff to operate the kiosk

### Success Criteria

- Employees can record attendance in under 3 seconds per scan
- Administrators can pull a full monthly DTR for any employee in under 30 seconds
- Zero false Time Out records due to accidental double-scans
- 100% of attendance data stored persistently in Neon PostgreSQL

---

## 3. Stakeholders & Users

| Role | Description | Interaction |
|------|-------------|-------------|
| **Administrator** | HR staff or manager responsible for timekeeping | Uses Admin App (web, authenticated) |
| **Employee** | Regular staff member | Uses Kiosk App (physical terminal, no login) |
| **System Administrator** | Technical owner of the deployment | Manages infrastructure, DB, environment config |

### User Personas

**Admin (HR Manager)**
- Logs in with email and password
- Needs to view, correct, and export attendance records
- Creates and manages employees, departments, and schedules
- Generates reports for payroll processing

**Employee (Kiosk User)**
- Approaches the kiosk terminal and scans their ID card barcode
- Expects immediate visual confirmation (name, photo, time, status)
- Does not need any account credentials or manual input

---

## 4. System Architecture Overview

Timely is structured as a **Turborepo monorepo** with two frontend applications and one backend server.

```
timely/
├── apps/
│   ├── admin/        ← Admin Portal (React 19 + Vite + TailwindCSS v4)
│   ├── kiosk/        ← Kiosk Interface (React 19 + Vite, minimal UI)
│   └── server/       ← NestJS API (Prisma ORM + JWT auth)
├── packages/
│   ├── @repo/multiverse-ui   ← Internal component library
│   ├── @repo/app-providers   ← Shared React providers
│   ├── @repo/utilities       ← Shared utilities (createForm, formatDate, etc.)
│   └── @repo/hooks           ← Shared hooks
└── docs/
    └── BRD.md
```

### Data Flow

```
[Barcode Scanner]
       |
       v
[Kiosk App (React)]  --POST /attendance/scan-->  [NestJS Server]
                                                        |
[Admin App (React)]  --REST API (JWT)----------->  [NestJS Server]
                                                        |
                                                  [Neon PostgreSQL]
                                                  (via Prisma ORM)
```

### Communication

- All communication between frontend apps and the server is via **RESTful HTTP API** (JSON).
- The Admin App authenticates with a **JWT Bearer token** stored in `localStorage`.
- The Kiosk App makes **unauthenticated** scan requests to a dedicated public endpoint.
- Server-side cooldown logic prevents duplicate attendance entries.

---

## 5. Functional Requirements

### FR-01: Employee Management

**Actors:** Administrator

**Description:** Administrators can create, view, update, and deactivate employee records.

**Fields per Employee:**

| Field | Required | Notes |
|-------|----------|-------|
| Employee Number | Yes | Unique identifier; value encoded in barcode |
| First Name | Yes | |
| Last Name | Yes | |
| Email | No | |
| Phone | No | |
| Department | Yes | Reference to Department |
| Position / Job Title | No | Free text |
| Work Schedule | Yes | Reference to WorkSchedule |
| Profile Photo | No | Uploaded image; displayed on kiosk scan feedback |

**Requirements:**

- `FR-01.1` Administrator can create a new employee with all fields listed above.
- `FR-01.2` Administrator can edit any field on an existing employee record.
- `FR-01.3` Administrator can view a paginated list of all employees with search and filter by department.
- `FR-01.4` Administrator can view the full detail page of a single employee.
- `FR-01.5` Administrator can deactivate (soft-delete) an employee. Deactivated employees cannot log attendance at the kiosk.
- `FR-01.6` Employee Number must be unique system-wide. Duplicate entry must be rejected with a clear error.
- `FR-01.7` Profile photo upload is optional. A default avatar placeholder is shown when no photo is set.

---

### FR-02: Department Management

**Actors:** Administrator

**Description:** Administrators manage the list of departments that employees belong to.

**Requirements:**

- `FR-02.1` Administrator can create a new department with a unique name.
- `FR-02.2` Administrator can rename an existing department.
- `FR-02.3` Administrator can view a list of all departments.
- `FR-02.4` Administrator can delete a department only if no active employees are assigned to it.

---

### FR-03: Work Schedule Management

**Actors:** Administrator

**Description:** Named work schedules define the expected daily working hours. Each employee is assigned one schedule.

**Fields per Work Schedule:**

| Field | Type | Notes |
|-------|------|-------|
| Name | String | e.g., "Standard Office Hours" |
| Start Time | Time (HH:MM) | Expected time-in |
| End Time | Time (HH:MM) | Expected time-out |
| Working Days | Array (enum) | e.g., [MON, TUE, WED, THU, FRI] |

**Requirements:**

- `FR-03.1` Administrator can create a new named work schedule.
- `FR-03.2` Administrator can edit an existing schedule.
- `FR-03.3` Administrator can view a list of all schedules.
- `FR-03.4` Working days are selectable individually (Mon–Sun).
- `FR-03.5` Deleting a schedule is only allowed when no employees are currently assigned to it.
- `FR-03.6` The schedule is used server-side to compute tardiness, undertime, and hours worked when generating `AttendanceRecord` summaries.

---

### FR-04: Attendance Viewing & Editing

**Actors:** Administrator

**Description:** Administrators can review all attendance entries and make corrections when necessary (e.g., missed scan, scanner malfunction).

**Requirements:**

- `FR-04.1` Administrator can view a paginated list of `AttendanceRecord` rows, filterable by:
  - Date range
  - Employee name or number
  - Department
  - Late / Undertime flags
- `FR-04.2` Each record displays: employee name, date, time-in, time-out, late flag, undertime flag, total hours worked.
- `FR-04.3` Administrator can edit the time-in and/or time-out of any record.
- `FR-04.4` Editing a record triggers recalculation of tardiness, undertime, and total hours worked fields.
- `FR-04.5` Administrator can add a note/reason to any manual edit (`adminNote` field).
- `FR-04.6` Raw scan logs (`AttendanceLog`) are viewable separately for auditing (read-only, not editable).

---

### FR-05: Reports

**Actors:** Administrator

**Description:** The system generates three report types for HR and payroll use.

#### Report 1: Daily Attendance Summary

- Lists all employees for a selected date.
- Shows status per employee: **Present**, **Absent**, **Late**, **On Leave** (manual flag, future scope).
- Exportable as CSV or printable.

#### Report 2: Monthly DTR per Employee

- Shows the full calendar month of attendance for one employee.
- Each row: date, day of week, time-in, time-out, hours worked, late minutes, undertime minutes.
- Totals row at bottom: total days present, total hours, total late, total undertime.
- Exportable as CSV or printable.

#### Report 3: Late / Undertime Report

- Date range filter (default: current month).
- Lists employees with tardiness or undertime occurrences.
- Shows: employee name, department, date, late minutes, undertime minutes.
- Sortable by late minutes or undertime minutes.

**Requirements:**

- `FR-05.1` All three reports are accessible from the Admin App.
- `FR-05.2` All reports support CSV export.
- `FR-05.3` All reports support browser print formatting.
- `FR-05.4` Reports reflect real-time data (no stale cache).

---

### FR-06: Barcode Scan Interface (Kiosk)

**Actors:** Employee (physical barcode scanner)

**Description:** The Kiosk App is a full-screen, always-on web page displayed on a dedicated terminal. It listens for barcode input and records attendance automatically.

**Requirements:**

- `FR-06.1` The kiosk displays a full-screen idle state showing the current date, time (live clock), and a prompt (e.g., "Scan your ID to record attendance").
- `FR-06.2` The kiosk listens continuously for barcode input using a USB/HID barcode scanner operating in keyboard emulation mode.
- `FR-06.3` Upon a valid scan, the system:
  1. Sends the employee number to the server via `POST /attendance/scan`.
  2. Displays a feedback card showing: employee full name, profile photo (or placeholder), current time, and scan status (TIME IN or TIME OUT).
- `FR-06.4` Feedback is displayed for approximately 4–5 seconds before returning to the idle state.
- `FR-06.5` If the employee number is not found, display an error state: "Employee not found."
- `FR-06.6` If the scan is rejected due to cooldown (see FR-07), display a "Already recorded" message with the last scan time.
- `FR-06.7` No login, no navigation, no other UI elements beyond the scan feedback and idle screen.
- `FR-06.8` The kiosk UI is optimized for a single large display (≥1080p) and keyboard/scanner input only (no mouse interaction required).

---

### FR-07: Accidental Scan Prevention

**Actors:** Server (automated logic)

**Description:** Barcode scanners can emit duplicate signals (double-scan) within milliseconds. The system must prevent accidental double Time Out entries or missed Time In entries.

**Scan Logic (Server-Side):**

```
ON scan received for employee E on date D:

  1. Check if E has an AttendanceLog entry today.

  2. No entry today:
     → Create AttendanceLog { type: IN, scannedAt: now }
     → Upsert AttendanceRecord { date: D, timeIn: now }
     → Return: { status: "TIME_IN", employee: ... }

  3. Has entry today, last scan was < cooldownWindow ago:
     → Ignore / silently discard
     → Return: { status: "ALREADY_RECORDED", lastScan: ..., employee: ... }

  4. Has entry today, last scan was >= cooldownWindow ago:
     → Create AttendanceLog { type: OUT, scannedAt: now }
     → Update AttendanceRecord { timeOut: now }
     → Recalculate undertime, totalHoursWorked
     → Return: { status: "TIME_OUT", employee: ... }
```

**Requirements:**

- `FR-07.1` Cooldown window is configurable via server environment variable (`SCAN_COOLDOWN_MINUTES`, default: `120` minutes / 2 hours).
- `FR-07.2` Cooldown logic is enforced server-side only (not client-side) to prevent bypass.
- `FR-07.3` All scan events (including ignored ones) are logged to `AttendanceLog` for audit purposes.
- `FR-07.4` The kiosk displays appropriate feedback for each outcome (TIME_IN, TIME_OUT, ALREADY_RECORDED, NOT_FOUND).

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Kiosk scan response must complete (round-trip to server) in under 1 second on a local network. |
| NFR-02 | Reliability | The kiosk must recover automatically after a page refresh or browser restart (no state loss for pending scans). |
| NFR-03 | Availability | Server must be deployable and self-restartable (e.g., via PM2 or container). |
| NFR-04 | Security | Admin App login protected by JWT with expiry. Kiosk scan endpoint is public but rate-limited. |
| NFR-05 | Data Integrity | All attendance data persisted in Neon PostgreSQL. No in-memory-only state. |
| NFR-06 | Usability | Kiosk idle screen and scan feedback must be legible from 2–3 meters away. |
| NFR-07 | Maintainability | Follow existing monorepo conventions (module structure, form patterns, query hooks). |
| NFR-08 | Scalability | Single location; no multi-branch or multi-tenant requirements. |
| NFR-09 | Browser Support | Admin App: latest Chrome/Edge/Firefox. Kiosk: Chrome (dedicated terminal). |

---

## 7. Technical Stack & Architecture

### Frontend (Admin & Kiosk)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | Latest | Build tool + dev server |
| TailwindCSS | v4 | Utility-first styling (Admin App) |
| TanStack Query | v5 | Server state management |
| `createForm` / react-geek-form | Internal | Form management with Zod validation |
| Zod | Latest | Schema validation |
| Axios | Latest | HTTP client (with interceptors) |
| `use-scan-detection` or `onScan.js` | Latest | Barcode scanner input detection (Kiosk) |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | Latest | API framework |
| Prisma ORM | Latest | Database access layer |
| Neon DB | PostgreSQL 16 | Hosted PostgreSQL database |
| JWT / `@nestjs/jwt` | Latest | Authentication for Admin |
| `bcrypt` | Latest | Password hashing |
| `class-validator` | Latest | DTO validation |

### Monorepo

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo task orchestration |
| npm workspaces | Package management |

### App Port Assignments

| App | Port |
|-----|------|
| `apps/admin` | 5174 |
| `apps/kiosk` | 5175 |
| `apps/server` | 3000 |

---

## 8. Data Model

### Entity-Relationship Overview

```
Department 1──* Employee
WorkSchedule 1──* Employee
Employee 1──* AttendanceLog
Employee 1──* AttendanceRecord
```

### Models

#### `Department`
```
id          String   @id @default(cuid())
name        String   @unique
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
employees   Employee[]
```

#### `WorkSchedule`
```
id           String     @id @default(cuid())
name         String     @unique
startTime    String     // "HH:MM" format (e.g., "08:00")
endTime      String     // "HH:MM" format (e.g., "17:00")
workDays     String[]   // ["MON","TUE","WED","THU","FRI"]
createdAt    DateTime   @default(now())
updatedAt    DateTime   @updatedAt
employees    Employee[]
```

#### `Employee`
```
id             String       @id @default(cuid())
employeeNumber String       @unique
firstName      String
lastName       String
email          String?
phone          String?
position       String?
photoUrl       String?
isActive       Boolean      @default(true)
departmentId   String
department     Department   @relation(...)
scheduleId     String
schedule       WorkSchedule @relation(...)
createdAt      DateTime     @default(now())
updatedAt      DateTime     @updatedAt
attendanceLogs     AttendanceLog[]
attendanceRecords  AttendanceRecord[]
```

#### `AttendanceLog`
Raw, immutable scan events. Never edited after creation.

```
id          String       @id @default(cuid())
employeeId  String
employee    Employee     @relation(...)
date        DateTime     @db.Date
scannedAt   DateTime
type        ScanType     // enum: IN | OUT
createdAt   DateTime     @default(now())
```

#### `AttendanceRecord`
Computed daily summary. Editable by admin.

```
id               String    @id @default(cuid())
employeeId       String
employee         Employee  @relation(...)
date             DateTime  @db.Date
timeIn           DateTime?
timeOut          DateTime?
isLate           Boolean   @default(false)
isUndertime      Boolean   @default(false)
lateMinutes      Int       @default(0)
undertimeMinutes Int       @default(0)
totalHoursWorked Float?
adminNote        String?
createdAt        DateTime  @default(now())
updatedAt        DateTime  @updatedAt

@@unique([employeeId, date])
```

#### `User` (Admin accounts)
```
id             String   @id @default(cuid())
email          String   @unique
hashedPassword String
name           String
createdAt      DateTime @default(now())
updatedAt      DateTime @updatedAt
```

### Enums
```
enum ScanType {
  IN
  OUT
}

enum DayOfWeek {
  MON
  TUE
  WED
  THU
  FRI
  SAT
  SUN
}
```

---

## 9. UI/UX Notes

### Admin App (`apps/admin`)

- Follows the `@repo/multiverse-ui` component library conventions.
- Module structure mirrors existing apps (e.g., `apps/core`): `page.tsx`, `schemas.ts`, `_hooks/index.ts`.
- Sidebar navigation with modules: Employees, Departments, Schedules, Attendance, Reports.
- All forms use `createForm` with Zod schemas.
- Data tables use `Table` from `@repo/multiverse-ui` with pagination and filtering.

### Kiosk App (`apps/kiosk`)

- Single-page, full-screen layout (no routing needed beyond the one page).
- **Idle State**: Large centered prompt text, current date, live digital clock (updates every second).
- **Feedback State** (shown for ~4–5 seconds after scan):
  - Large employee photo (or placeholder avatar)
  - Full name (large text, readable from distance)
  - Current time
  - Status badge: green "TIME IN" or blue "TIME OUT" or orange "ALREADY RECORDED" or red "NOT FOUND"
  - Auto-dismisses back to idle state after timeout
- Minimal dependencies — no sidebar, no forms, no navigation.
- Tailwind or plain CSS acceptable; simplicity preferred.

---

## 10. Barcode Scanning Research Summary

### How USB/HID Barcode Scanners Work

USB barcode scanners in HID (Human Interface Device) mode act as a **virtual keyboard**. When a barcode is scanned:
1. The scanner rapidly types each character of the barcode value.
2. Emits an `Enter` keypress at the end.
3. The entire sequence happens in ~50–200ms (too fast for a human typist).

### Detection Strategy

Distinguish scanner input from real keyboard input using **timing**: real keystrokes have gaps of 50–300ms between characters; scanner input arrives in bursts with < 30ms gaps.

### Recommended Library: `use-scan-detection`

A React hook that wraps the detection logic:

```tsx
import { useScanDetection } from 'use-scan-detection';

useScanDetection({
  onComplete: (barcode) => handleScan(barcode),
  minLength: 3,          // minimum barcode length
  averageWaitTime: 50,   // ms threshold between keystrokes
});
```

**Alternative:** `onScan.js` (vanilla JS, framework-agnostic).

### Why Not a Camera/QR Scanner?

- USB/HID scanner is faster (< 200ms), more reliable in varied lighting, and requires no camera permission or computer vision.
- The organization already uses barcode-based employee IDs.

### Barcode Format

- Employee Number is the barcode value (e.g., `EMP-00123`).
- Code 128 or Code 39 formats are both supported by standard USB scanners.
- The barcode is printed on the employee ID card.

---

## 11. Out of Scope

The following features are explicitly **not** included in the initial release:

| Feature | Notes |
|---------|-------|
| Multi-branch / multi-location | Single location only |
| Mobile app (iOS/Android) | Web-only |
| Leave management | No leave types, leave requests, or leave balance tracking |
| Overtime calculation | No overtime pay computation |
| Payroll integration | Reports only; no direct payroll system connection |
| Biometric (fingerprint/face) login | Barcode only |
| QR code scanning via camera | USB/HID scanner only |
| Employee self-service portal | Employees interact only via kiosk |
| Role-based access control (RBAC) | Single admin role |
| Real-time notifications / alerts | No push notifications or emails on late/absent |
| Shift scheduling | Fixed daily schedules only (no shift rotation) |

---

## 12. Assumptions & Constraints

| # | Assumption / Constraint |
|---|------------------------|
| A1 | The organization operates from a single physical location. |
| A2 | Employees have physical ID cards with a barcode encoding their Employee Number. |
| A3 | The kiosk terminal has a USB barcode scanner connected and a persistent internet connection to reach the server. |
| A4 | The kiosk runs a Chromium-based browser in fullscreen/kiosk mode (no browser UI). |
| A5 | Admin users will be seeded or created via a one-time setup (no public self-registration for admins). |
| A6 | All times are stored and processed in the server's local timezone. Timezone is configured once via environment variable and does not change. |
| A7 | Neon DB is the designated PostgreSQL provider. Local development uses a Neon branch. |
| A8 | The system follows the existing Turborepo monorepo conventions documented in `CLAUDE.md`. |
| A9 | Employee Number uniqueness is the sole identifier between physical ID card and digital record. |
| A10 | A single cooldown window applies system-wide (not per-employee or per-schedule). |

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **DTR** | Daily Time Record. A log of an employee's daily time-in and time-out entries. |
| **Time In** | The recorded moment an employee begins their workday (first valid scan of the day). |
| **Time Out** | The recorded moment an employee ends their workday (last valid scan after cooldown). |
| **Tardiness / Late** | Arriving after the scheduled start time. Measured in minutes past start time. |
| **Undertime** | Leaving before the scheduled end time. Measured in minutes before end time. |
| **Cooldown Window** | A configurable time buffer (default: 2 hours) that prevents a second scan from being treated as Time Out too soon after Time In. |
| **AttendanceLog** | Raw, immutable record of every barcode scan event (IN or OUT). |
| **AttendanceRecord** | Computed daily summary per employee derived from AttendanceLog entries, including tardiness and hours worked. Editable by admin. |
| **Kiosk** | The physical terminal running the Kiosk App in fullscreen mode at the office entrance. |
| **HID** | Human Interface Device. USB standard that allows barcode scanners to act as keyboards. |
| **Employee Number** | Unique alphanumeric identifier assigned to each employee; printed as a barcode on their ID card. |
| **Work Schedule** | A named configuration defining expected start time, end time, and working days for a group of employees. |
