# Devil's Advocate — Timely DTR System

**Document Version:** 1.0
**Date:** 2026-03-16
**Author:** Devil's Advocate Agent
**References:** [BRD.md](./BRD.md), [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

> This document is a critical review of the BRD and development plan. Its purpose is to surface design weaknesses, missing requirements, and execution risks **before** they become expensive. It is not intended to block the project — it is intended to make the project succeed.

---

## 1. Design Decisions to Challenge

---

### 1.1 Cooldown Window (FR-07)

**Concern 1: 120 minutes is wrong for short-shift workers.**

The 120-minute default cooldown window assumes all employees work shifts longer than 2 hours. This will fail for employees with shifts shorter than 2 hours (e.g., a 1-hour part-time slot, or a training session). If such an employee times in and then legitimately tries to time out, the scan will be silently discarded and returned as `ALREADY_RECORDED`. Their Time Out will never be recorded for that day, making their attendance record permanently incomplete unless an admin manually corrects it.

Even for standard 8-hour schedules, a 120-minute cooldown means an employee who arrives and immediately leaves (emergency, illness) cannot time out until 2 hours have elapsed, even in the physical presence of an admin who knows the departure is legitimate.

**Concern 2: No per-employee or per-schedule override.**

A10 in the BRD explicitly states that "a single cooldown window applies system-wide (not per-employee or per-schedule)." This may be acceptable now, but it is a design decision made permanent by the data model: the `WorkSchedule` model has no `cooldownMinutes` field. Adding per-schedule cooldowns later would require a schema migration and a rewrite of the scan logic. The cost of making this configurable now is one extra nullable column and a minor change to the scan logic — the cost of not doing it now is a potentially disruptive migration later.

**Concern 3: The scan logic only supports one Time In and one Time Out per day.**

The scan algorithm checks `AttendanceLog` entries "today" and uses the last scan time to decide whether to record TIME_IN or TIME_OUT. There is no concept of a second shift, a half-day return, or a lunch-break Time Out/Time In cycle. Any employee who leaves and returns within the same day (e.g., a site visit and then returning to the office) will have their second Time In treated as a Time Out (after cooldown expires) or silently dropped (within cooldown). The BRD says "Shift scheduling" is out of scope, but the current design does not just defer split shifts — it actively produces incorrect records for them.

**Suggested mitigations:**

- Set the default `SCAN_COOLDOWN_MINUTES` to 60 minutes (not 120) and document this decision.
- Add a nullable `cooldownMinutes` field to `WorkSchedule` so that per-schedule overrides are possible without a schema rewrite.
- Document the single-scan-per-day limitation explicitly in the BRD as an assumption (not just "shift scheduling is out of scope"), so that future HR managers are not surprised.

---

### 1.2 Data Model: `workDays String[]`

**Concern 1: Not normalized — querying is expensive and fragile.**

`workDays String[]` stored as a PostgreSQL array is a denormalized design. It works at small scale, but has several tradeoffs:

- Querying "all schedules that include Monday" requires `WHERE 'MON' = ANY(workDays)` — this is non-standard SQL that does not use a normal B-tree index efficiently. A GIN index helps but adds complexity.
- Comparing two schedules to check if they have the same work days requires array comparison, not a simple equality check. `["MON","WED","FRI"]` and `["FRI","MON","WED"]` are NOT equal in PostgreSQL array semantics, even though they represent the same schedule. No ordering is enforced.
- Seeding and testing are harder: a test that checks `schedule.workDays` must account for arbitrary ordering.

**Concern 2: The `DayOfWeek` enum is defined but unused.**

The BRD defines a `DayOfWeek` enum (`MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`) but the `workDays` field is typed as `String[]`, not `DayOfWeek[]`. This means the database will happily accept `["MONDAY", "mon", "Monday", "1"]` with no validation error at the database level. Validation must be done entirely in the application layer (NestJS DTOs), and if that validation has a gap, corrupt data enters the DB silently.

**Suggested mitigations:**

- Change `workDays` to `DayOfWeek[]` in the Prisma schema to enforce the enum at the database level.
- Add a `@db` index or sort the array on write (always store in canonical Mon–Sun order) to make equality comparisons predictable.
- Alternatively, consider a `WorkScheduleDay` join table (`scheduleId`, `day`) — this is more normalized and trivially queryable, at the cost of a more complex Prisma include.

---

### 1.3 Time Storage

**Concern 1: "All times stored in server's local timezone" is a production timebomb.**

A6 states: "All times are stored and processed in the server's local timezone. Timezone is configured once via environment variable and does not change." The phrase "does not change" is an assumption, not a guarantee. If:

- The server is migrated to a cloud region in a different timezone,
- The OS timezone is accidentally reset during a system update,
- The Neon database is accessed from a different machine during a restore,

...all historical timestamps will be misinterpreted. UTC is the universally accepted standard for storing timestamps precisely because it is unambiguous across all environments. The "configured once" approach trades safety for convenience.

**Concern 2: `startTime` and `endTime` as `String` ("HH:MM") — format inconsistency risk.**

Nothing in the schema or BRD enforces that the string is actually in `HH:MM` format. PostgreSQL will store `"8:00"`, `"8:0"`, `"08:00"`, `"8am"`, and `"800"` without complaint. The tardiness and undertime calculation logic (Phase 4.7–4.8) must parse this string. If there is any inconsistency in how the string is written (e.g., an admin seeds a schedule via a DB console with `"8:00"` instead of `"08:00"`), the calculation will silently produce wrong results.

Prisma does not have a native `Time` type — the common alternatives are to use a `DateTime` with a dummy date (e.g., `1970-01-01T08:00:00Z`) or store as integer minutes since midnight (e.g., `480` for 08:00). Both are more robust than a free-form string.

**Concern 3: `AttendanceRecord.timeIn` and `timeOut` are `DateTime?`.**

Both are nullable. The tardiness calculation at scan time (Phase 4.7) and the undertime calculation (Phase 4.8) run when `timeOut` is recorded. But what happens if an admin edits only `timeIn` and leaves `timeOut` null? The recalculation (FR-04.4) must handle this case. The BRD does not specify what values `isLate`, `lateMinutes`, `isUndertime`, `undertimeMinutes`, and `totalHoursWorked` should hold when `timeOut` is null. This is a silent edge case that will produce NULL or zero values in reports.

**Suggested mitigations:**

- Store all timestamps in UTC. Apply timezone offset only at display time in the frontend, driven by a `DISPLAY_TIMEZONE` environment variable.
- Change `startTime`/`endTime` to `Int` (minutes since midnight). `480` = 08:00, `1020` = 17:00. This is unambiguous, trivially comparable, and trivially arithmetic.
- Document explicitly what the API returns and the UI displays when `timeOut` is null on a record.

---

### 1.4 JWT in localStorage

**Concern 1: XSS vulnerability.**

Storing JWT tokens in `localStorage` is explicitly flagged by OWASP as a security risk. Any JavaScript running in the admin app's origin (including injected scripts via XSS) can read `localStorage` and steal the token. This is an architectural pattern inherited from the existing `@repo/app-providers`, not a Timely-specific decision — but the BRD adopts it without acknowledging the tradeoff.

For an internal HR tool this may be an acceptable risk, but it should be a conscious decision, not an accidental one. The admin app has access to all employee records and attendance data.

**Concern 2: JWT expiry is unspecified.**

The BRD (NFR-04) says "JWT with expiry" but never specifies the expiry duration. Phase 2.3 says "include expiry in JWT" but does not set a value. Phase 14.9 says "confirm JWT expiry works" but there is nothing to confirm because no value has been decided. If a developer defaults to a common value like 7 days or 30 days without discussion, an admin's session remains valid for a week after they quit the company. There is no token refresh mechanism mentioned anywhere.

**Suggested mitigations:**

- Explicitly define the JWT expiry in the BRD (recommendation: 8–24 hours for an internal tool).
- Consider `httpOnly` cookies instead of `localStorage` for JWT storage (immune to XSS), noting this requires a change to `@repo/app-providers` that may affect other apps in the monorepo.
- Add a refresh token flow or at minimum document that token revocation is not supported and an admin must change their password if a session is compromised.

---

### 1.5 Photo Upload

**Concern 1: Storage backend is completely unspecified.**

`photoUrl String?` stores a URL, but the BRD does not specify where the photo file actually lives. Phase 3.14 says "store URL in `photoUrl`; use file storage or base64" — this is not a decision, it is a deferral. The three realistic options have very different operational implications:

- **Base64 in the DB:** Immediate, zero-config. Will cause serious performance degradation as `Employee` rows balloon in size. Every query that returns employees (attendance list, report, kiosk scan response) will carry kilobytes of base64 data. The kiosk scan response currently returns employee data including `photoUrl` — if that URL is a 200KB base64 string, the 1-second scan response target (NFR-01) becomes very hard to meet.
- **Local disk on the server:** Simple but makes the NestJS server stateful. PM2 restarts are fine, but migrations to a new server, Docker containers, or horizontal scaling become painful. Files must be backed up separately from the database.
- **Object storage (S3-compatible, Cloudflare R2, etc.):** The correct long-term choice, but adds infrastructure complexity and a dependency not mentioned anywhere in the tech stack.

**Suggested mitigations:**

- Decide on a storage backend before Phase 3, not during it. Recommendation: use an S3-compatible object store (Cloudflare R2 has a generous free tier). Store the URL in `photoUrl`.
- If the decision is local disk for simplicity, explicitly note this in the BRD as a constraint that limits deployment options, and ensure the backup strategy covers the upload directory.
- Add a file size limit and image type validation to the upload endpoint regardless of storage choice.

---

### 1.6 Kiosk Security

**Concern 1: Employee number guessing via the scan endpoint.**

`POST /attendance/scan` is public and rate-limited. The rate limit is mentioned (NFR-04, Phase 4.10) but the limit values are never specified (requests per second? per IP? per employee number?). An attacker who knows the employee number format (e.g., `EMP-00001` through `EMP-01000`) could script a scan for every employee at the start of the workday, creating fraudulent TIME_IN records for employees who have not arrived. Rate limiting by IP does not help if the attacker is on the same local network as the kiosk.

This is an internal tool, so the threat model is different from a public API — but a disgruntled employee or an HR dispute could make fraudulent attendance records a real concern.

**Concern 2: Kiosk auto-recovery is mentioned in NFR-02 but not designed.**

NFR-02 states: "The kiosk must recover automatically after a page refresh or browser restart (no state loss for pending scans)." But the kiosk app has no local state for pending scans — it is fully stateless. A page refresh during a scan (between the barcode input and the server response) will simply drop the scan. The NFR as written cannot be met by a stateless web app without a service worker or local queue.

Separately, Phase 14.12 says "verify kiosk browser auto-launches fullscreen after system reboot" but there is no task anywhere in the plan that sets this up. This is an operational task (writing an autostart script, configuring Chrome kiosk mode) that requires access to the physical machine. It is not a frontend development task.

**Suggested mitigations:**

- Define explicit rate limit values in the BRD (e.g., 10 requests per minute per IP, 3 requests per hour per employee number).
- Rewrite NFR-02 to be accurate: "A scan that completes successfully is immediately persisted to the database. A scan that is in-flight at the time of a page refresh will be lost and must be re-scanned." This is the actual behavior.
- Add a Phase 0 or Phase 14 task that documents the kiosk machine setup procedure (Chrome kiosk mode flags, OS autostart, screen timeout disabled).

---

### 1.7 Reports as "Real-Time" (FR-05.4)

**Concern: TanStack Query's default stale time is 0, but cache time is not 0.**

FR-05.4 says "Reports reflect real-time data (no stale cache)." TanStack Query v5's default `staleTime` is 0 (data is considered stale immediately) but `gcTime` (formerly `cacheTime`) is 5 minutes. This means:

- A report fetched once will show cached data if the user navigates away and returns within 5 minutes, unless the query is explicitly invalidated or `staleTime: 0` causes an automatic background refetch.
- Background refetch only runs if the window is focused. A report left open for 30 minutes will show 30-minute-old data.
- The behavior depends on `refetchOnWindowFocus` (default: `true`) and `refetchOnMount` (default: `true`), but these are not guaranteed to result in "real-time" data in all scenarios.

"No stale cache" is a strong guarantee. If it is required, the correct implementation is `staleTime: 0` combined with disabling caching entirely on report queries, or using `refetchInterval` to poll — neither of which is mentioned.

**Suggested mitigation:**

- In `_hooks/index.ts` for the reports module, explicitly configure `staleTime: 0` and `refetchOnMount: 'always'` on all report queries, and document this as the mechanism fulfilling FR-05.4.
- Alternatively, loosen FR-05.4 to "Reports data is no more than 60 seconds old when first loaded" — which is what the default TanStack Query behavior actually provides.

---

### 1.8 Single Admin Role

**Concern: No audit trail for admin actions — the fox guards the henhouse.**

There is no RBAC (explicitly out of scope). There is one admin role with full read-write access to all attendance records. FR-04.5 adds an `adminNote` field to manual edits, which is good — but:

- There is no record of **who** made the edit. The `AttendanceRecord` model has no `editedByUserId` field or `editedAt` timestamp beyond the generic `updatedAt`.
- There is no constraint preventing an admin from editing a record and leaving `adminNote` blank.
- An admin can edit attendance records to manipulate tardiness counts in payroll reports, and there is no second-approver or audit log to detect this.
- The `AttendanceLog` is described as "immutable" and "read-only," which is correct for scan events — but there is no corresponding immutable log for admin edits.

**Suggested mitigations:**

- Add `editedByUserId String?` and `editedAt DateTime?` to `AttendanceRecord` to record who made the last manual change.
- Make `adminNote` required (not optional) when `timeIn` or `timeOut` is manually overridden — enforce this at the API level, not just the UI level.
- Consider an `AttendanceEditLog` table (immutable append-only) that records every admin edit: who, when, what changed. This is cheap to implement and invaluable for HR disputes.

---

## 2. Missing Requirements / Gaps

---

**Gap 1: Behavior of attendance records when an employee is deactivated.**

FR-01.5 says deactivated employees cannot log attendance at the kiosk. But it does not specify:
- Are their historical `AttendanceRecord` and `AttendanceLog` rows preserved or deleted?
- Do they appear in reports for past periods?
- Can an admin view or edit their attendance records after deactivation?

The data model uses soft-delete (`isActive: false`), which suggests preservation — but this is never stated. Reports that query "all employees for a given date" must decide whether to include deactivated employees for historical dates. This is a real scenario: an employee is deactivated mid-month, and HR needs the monthly DTR for their last partial month.

**Recommendation:** Explicitly state in the BRD that deactivated employees' historical records are preserved and visible in reports for past date ranges. Add a filter option to attendance and report views to include/exclude inactive employees.

---

**Gap 2: Server downtime during employee scan.**

If the NestJS server is unreachable when an employee scans, the kiosk will show an error (the axios request will fail). The BRD does not specify what the error UI looks like, what the employee should do, or whether the scan is recoverable. NFR-02 says "no state loss for pending scans" but as discussed above, this is not achievable with the current design.

There is no mention of an offline fallback (local queue, service worker), which means server downtime = kiosk non-functional = employees cannot record attendance. For a system that replaces paper timesheets, this is a higher-stakes failure mode than the BRD acknowledges.

**Recommendation:** The BRD should explicitly classify this as an accepted risk with a defined manual fallback (e.g., "if kiosk is non-functional, employees notify HR and admin manually adds records"). This should be communicated to HR before go-live.

---

**Gap 3: No proactive absent-employee detection.**

The daily attendance summary report shows who is absent for a selected date — but only when an admin actively opens the report. There is no mechanism for HR to be notified at, say, 9:30 AM that 5 employees have not scanned in. The BRD explicitly scopes out "real-time notifications / alerts," which is a legitimate product decision. However, the absence of this feature means HR must remember to pull the daily report every morning before they can act on absences — it is a reactive workflow, not a proactive one.

This is noted here not as a bug but as a risk: HR may not adopt the system if the primary pain point (knowing who is absent) still requires a manual daily action.

**Recommendation:** No change needed at this stage, but include this in a future roadmap section. Consider adding a "Today's Absent Employees" widget to the admin dashboard as a Phase 1.5 quick win.

---

**Gap 4: Timezone library and DST handling.**

A6 says the timezone is "configured once via environment variable." The BRD does not specify which library handles timezone conversion on the server, or whether DST transitions are handled. The Philippines (most likely the deployment region, given the codebase references to Philippine address queries in `@repo/hooks`) does not observe DST — but this cannot be assumed without stating it. If the server is hosted internationally or the company moves jurisdictions, DST could cause all timestamps to shift by one hour at transition time.

Even without DST, parsing "HH:MM" strings against the current server timezone requires a timezone-aware date library. NestJS does not provide one by default. Using `new Date()` with string concatenation to compare times will produce wrong results during timezone edge cases.

**Recommendation:** Explicitly specify `dayjs` with `dayjs-plugin-timezone` or `date-fns-tz` as the timezone library in the tech stack. Add a test for time calculations at a timezone boundary (e.g., 23:00–01:00 shifts, though these are unlikely for office hours — the real risk is at DST transition for non-PH deployments).

---

**Gap 5: Default admin password — no forced password change flow.**

Phase 1.8 creates a seed admin user. The BRD implies a default password exists (referenced in the prompt as `Admin@1234`). There is no requirement or task anywhere for the user to change this password on first login. If the system goes live with the seed password still active and HR does not change it promptly, the admin account is effectively public knowledge to anyone who reads the deployment docs.

**Recommendation:** Add a `passwordChangedAt DateTime?` field to `User` and implement a middleware check that forces a password change on first login (redirect to a change-password page if `passwordChangedAt` is null). This is a 1–2 hour implementation task that closes a significant security gap.

---

**Gap 6: No unique constraint on `AttendanceLog` entries.**

`AttendanceRecord` has `@@unique([employeeId, date])`, which correctly prevents duplicate daily summaries. But `AttendanceLog` has no uniqueness constraint. Nothing prevents two rapid concurrent requests (a race condition on the public scan endpoint) from creating two `AttendanceLog { type: IN }` entries within milliseconds of each other. The first would create the `AttendanceRecord`, the second would try to upsert it (no-op) but still insert a second `AttendanceLog` row. The audit log would then show two TIME_IN entries for the same employee at the same millisecond, which would confuse any audit review.

**Recommendation:** Add a database-level unique index on `AttendanceLog(employeeId, date, type)` — or at minimum add a pessimistic lock or database transaction around the scan logic to prevent concurrent inserts for the same employee.

---

**Gap 7: No specification for `GET /auth/me` behavior when token is expired.**

Phase 2.6 exposes `GET /auth/me`. The `AuthProvider` in `@repo/app-providers` uses this endpoint to validate the token on app load. If the token is expired, the server returns 401, and the `QueryProvider` axios interceptor redirects to `/logout`. This is standard behavior — but the BRD does not specify the JWT expiry, so the interaction between `GET /auth/me` and token expiry is untested until Phase 14.9, which is the last phase.

**Recommendation:** Define JWT expiry in Phase 2.3. Add an explicit test for expired-token behavior in Phase 7 (Admin App shell), not Phase 14.

---

## 3. Development Plan Risks

---

### 3.1 Hidden Dependencies Between Phases

**Phase 4 depends on a finalized Phase 1 schema — but Phase 1 decisions affect Phase 4 heavily.**

The scan logic in Phase 4 performs tardiness and undertime calculations by comparing `timeIn` to `schedule.startTime` (stored as a string). If the string format decision is not locked before Phase 4 begins, the calculation code will be written against an assumption that may change. This is a hidden dependency: Phase 4 cannot be fully implemented correctly until the "HH:MM as String vs. Int vs. DateTime" question is resolved.

**Phase 8 (Employees) depends on Phase 3.14 (photo upload) — but 3.14 has no storage decision.**

Phase 8.2 builds the employee create form with photo upload. But Phase 3.14 says "use file storage or base64" without deciding. This means Phase 8 cannot be properly tested until a storage backend is chosen. A developer who picks base64 for speed and intends to "fix it later" will have base64 images baked into the frontend display components, making migration to object storage more disruptive.

**Phase 13 (Kiosk) depends on Phase 4 (scan logic) — but Phase 4 edge cases are not fully specified.**

Phase 13 builds the feedback UI against the four scan outcomes (TIME_IN, TIME_OUT, ALREADY_RECORDED, NOT_FOUND). If Phase 4 has bugs (e.g., race conditions, wrong cooldown logic, incorrect timezone handling), Phase 13's UI will display incorrect status messages that are very hard to debug at the kiosk level. The kiosk has no dev tools in production mode.

### 3.2 Phases Likely to Be Underestimated

**Phase 4 — Attendance Scan Logic**

This is the most complex backend phase and is listed as 11 tasks. However:
- The cooldown calculation must handle timezone-aware "today" boundaries correctly.
- The tardiness/undertime calculation requires parsing time strings, comparing them to `DateTime` values, and handling edge cases (e.g., night shifts that cross midnight, though not in scope — but the code must not break if `endTime` < `startTime`).
- Race condition handling for concurrent scans (same employee, two rapid requests) is not addressed anywhere.
- The upsert logic (`upsert AttendanceRecord`) must be wrapped in a transaction to be atomic. If the `AttendanceLog` insert succeeds but the `AttendanceRecord` upsert fails, the raw log shows a scan that has no corresponding summary record.

This phase should be estimated at 2–3x the other backend phases.

**Phase 6 — Reports**

Three endpoints that each require non-trivial SQL/Prisma queries:
- `GET /reports/daily-summary` must determine "absent" employees by comparing the full employee list against `AttendanceRecord` entries for the date — employees with no record are absent. This requires a LEFT JOIN or equivalent and must handle inactive employees (see Gap 1 above).
- `GET /reports/monthly-dtr` must generate a row for every calendar day of the month, including days with no attendance record. This is a "fill in the gaps" query that is not trivially expressible in Prisma.
- Sorting/filtering on derived fields (e.g., sort by late minutes) may require raw SQL.

This phase is listed as 3 tasks but is likely 3–5 days of backend work.

**Phase 14 — QA, Polish & Deployment**

Phase 14 is 12 tasks listed at the end of the plan. In practice, this phase tends to expand dramatically when:
- Edge cases in scan logic surface during real scanning tests.
- Print CSS requires significant iteration to produce clean page breaks on all three report types.
- The kiosk machine requires OS-level configuration (autostart, screen timeout, kiosk mode) that is not a frontend task.
- Production environment variables differ from development (different timezone, different DB URL, rate limits that interfere with testing).

This phase should be explicitly time-boxed rather than listed as a checklist.

### 3.3 Bugs in Phase 4 That Propagate to Phase 13

The kiosk in Phase 13 is a passive display layer — it sends a scan, receives a status, and shows the result. If Phase 4's scan logic has bugs:

- **Wrong `status` returned:** If the cooldown logic is off-by-one (using `<` instead of `<=`, or comparing UTC timestamps against a local-time "today" boundary), an employee who has already timed out may get a `TIME_IN` feedback card on their second scan of the day. The kiosk UI has no way to detect or correct this — it shows whatever the server returns.
- **Silent data corruption:** If the transaction is not atomic (Log insert succeeds, Record upsert fails), the kiosk will show `TIME_IN` to the employee, but no `AttendanceRecord` will exist. The employee believes they are recorded; they are not. This will only be discovered at report time.
- **No integration test between Phase 4 and Phase 13:** The development plan runs Phase 4 in Phase 4 and Phase 13 in Phase 13 with no intermediary integration test phase. The first end-to-end test is in Phase 14 (task 14.1). This means bugs in Phase 4 that only manifest with a real kiosk UI are not caught until the last phase.

**Recommendation:** Add a Phase 4.12 task: "Write automated unit tests for all scan logic branches (TIME_IN, TIME_OUT, ALREADY_RECORDED, NOT_FOUND, race condition, timezone boundary)." These tests are the Phase 13 integration test proxy.

---

## 4. Operational Risks

---

### 4.1 Database Migration Failures Mid-Run

Prisma migrations in production run as a single transaction per migration file. If a migration fails mid-run (e.g., due to a constraint violation on existing data, a Neon DB connection timeout, or a schema conflict), Prisma marks the migration as "failed" in `_prisma_migrations` and the database is in a partial state. Recovering from this requires manual SQL intervention.

With Neon DB specifically, the connection pooling (PgBouncer) can cause migration timeouts for long-running ALTER TABLE statements on large tables. For initial migrations this is low risk, but for future migrations that add columns to `AttendanceRecord` (which may accumulate millions of rows), this becomes a real concern.

**Recommendation:** Test every Prisma migration against a Neon branch before applying to production (this is what Neon branches are designed for — the development plan already mentions Neon but does not mandate branch-based migration testing). Add a rollback procedure to the deployment documentation.

---

### 4.2 Backup Strategy for Neon DB

The BRD and development plan make no mention of backups. Neon DB (Serverless PostgreSQL) provides point-in-time restore (PITR) on paid plans, but:
- The free tier has limited PITR window (typically 7 days).
- Backups are not the same as tested restores. A backup that has never been restored is an unverified backup.
- Attendance records are legal/HR documents in many jurisdictions — their loss could have compliance implications.

**Recommendation:** Explicitly define a backup policy in the BRD or deployment docs: backup frequency, retention period, and a tested restore procedure. Add a Phase 14 task for "verify database backup and test point-in-time restore on a Neon branch."

---

### 4.3 Kiosk Non-Functional When Neon DB is Unavailable

The kiosk is fully dependent on the NestJS server, which is fully dependent on Neon DB. Any of the following will make the kiosk non-functional:

- Neon DB cold start (serverless auto-suspend after inactivity — free tier suspends after 5 minutes of inactivity)
- Neon DB maintenance window
- Network outage between the server and Neon (even if the kiosk can reach the server)
- NestJS server crash (mitigated by PM2/Docker)

For the Neon free tier, the cold start latency (2–5 seconds for the first query after suspend) could alone violate NFR-01 ("scan response under 1 second"). The kiosk may show a loading state for 3–6 seconds on the first scan after a quiet night.

**Recommendation:**
- Explicitly document that the kiosk requires a persistent internet connection and that Neon DB availability is a hard dependency.
- For the Neon free tier: configure the server to run a periodic keepalive query (e.g., `SELECT 1` every 4 minutes) to prevent auto-suspend during working hours. This is a 10-line cron job.
- Consider upgrading to a Neon paid tier for production use (fixed compute, no cold start, longer PITR window). The free tier is appropriate for development and staging, not for a live HR system.

---

## 5. Recommendations Summary

| # | Concern | Recommendation | Priority |
|---|---------|----------------|----------|
| R-01 | Cooldown default too long for short shifts | Reduce default to 60 min; add nullable `cooldownMinutes` to `WorkSchedule` | HIGH |
| R-02 | Scan logic produces wrong records for same-day returns | Document single-in/single-out-per-day limitation explicitly as a system constraint | HIGH |
| R-03 | `workDays String[]` accepts invalid values; enum unused | Change to `DayOfWeek[]` in Prisma schema; enforce canonical ordering on write | MEDIUM |
| R-04 | Times stored in server local timezone | Store all timestamps in UTC; apply timezone offset only at display time | HIGH |
| R-05 | `startTime`/`endTime` as `String` — format not enforced | Store as `Int` (minutes since midnight) or validate and normalize on write | MEDIUM |
| R-06 | JWT expiry unspecified | Define expiry (recommendation: 8–24h) in BRD and in Phase 2.3 | HIGH |
| R-07 | JWT in localStorage (XSS risk) | Acknowledge risk in BRD; consider `httpOnly` cookies as alternative | MEDIUM |
| R-08 | Photo storage backend unspecified | Decide before Phase 3.14: recommend S3-compatible object storage | HIGH |
| R-09 | Scan endpoint: no employee-number-level rate limit | Add per-employee-number rate limit in addition to IP-based limit | MEDIUM |
| R-10 | Kiosk NFR-02 unachievable as stated | Rewrite NFR-02 to reflect actual behavior; document manual fallback for server downtime | MEDIUM |
| R-11 | No audit log for admin edits | Add `editedByUserId`, `editedAt` to `AttendanceRecord`; make `adminNote` required on edit | HIGH |
| R-12 | Deactivated employee records behavior unspecified | Explicitly state records are preserved; add inactive filter to reports | MEDIUM |
| R-13 | Default admin password — no forced change flow | Add `passwordChangedAt` to `User`; implement first-login redirect to change-password | HIGH |
| R-14 | Race condition on concurrent scans | Wrap scan logic in DB transaction; add unique index on `AttendanceLog(employeeId, date, type)` | HIGH |
| R-15 | No scan logic unit tests before kiosk integration | Add Phase 4.12: comprehensive unit tests for all scan branches and edge cases | HIGH |
| R-16 | Phase 6 reports underestimated | Allocate 3–5 days for report endpoints; use raw SQL for gap-filling and derived sorts | MEDIUM |
| R-17 | Neon DB cold start violates NFR-01 on free tier | Add keepalive cron during working hours; plan for paid tier in production | HIGH |
| R-18 | No backup policy defined | Define backup frequency, retention, and tested restore procedure in deployment docs | HIGH |
| R-19 | Kiosk machine OS setup has no corresponding dev task | Add explicit task for kiosk machine setup (Chrome kiosk mode, autostart, screen timeout) | MEDIUM |
| R-20 | `AttendanceRecord` fields undefined when `timeOut` is null | Specify expected field values in API contract when `timeOut` is null | LOW |

---

*This document should be reviewed against the BRD before Phase 1 begins. Items marked HIGH should be resolved or consciously accepted before any code is written. Items marked MEDIUM should be resolved before the affected phase begins. Items marked LOW can be deferred to Phase 14.*
