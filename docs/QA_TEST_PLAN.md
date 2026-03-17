# QA Test Plan
## Timely — Daily Time Record (DTR) System

**Version:** 1.0
**Date:** 2026-03-16
**Reference Documents:** [BRD.md](./BRD.md) | [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
**Status:** Draft

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Test Data Requirements](#2-test-data-requirements)
3. [Critical Path Test Cases](#3-critical-path-test-cases)
   - [FR-01: Employee Management](#fr-01-employee-management)
   - [FR-02: Department Management](#fr-02-department-management)
   - [FR-03: Work Schedule Management](#fr-03-work-schedule-management)
   - [FR-04: Attendance Viewing & Editing](#fr-04-attendance-viewing--editing)
   - [FR-05: Reports](#fr-05-reports)
   - [FR-06: Barcode Scan Interface (Kiosk)](#fr-06-barcode-scan-interface-kiosk)
   - [FR-07: Accidental Scan Prevention](#fr-07-accidental-scan-prevention)
4. [Edge Cases & Boundary Conditions](#4-edge-cases--boundary-conditions)
5. [Non-Functional Test Cases](#5-non-functional-test-cases)
6. [Regression Checklist](#6-regression-checklist)
7. [Known Risks & QA Concerns](#7-known-risks--qa-concerns)

---

## 1. Scope & Objectives

This test plan covers all functional and non-functional requirements for the Timely DTR system as defined in the BRD v1.0. It applies to:

- **Admin App** (`apps/admin`, port 5174) — authenticated web portal
- **Kiosk App** (`apps/kiosk`, port 5175) — unauthenticated scan terminal
- **Server** (`apps/server`, port 3000) — NestJS REST API

**Out of scope for this plan:** Multi-branch operation, leave management, overtime calculation, payroll integration, biometric input (all explicitly excluded from BRD Section 11).

**Test Environment Assumptions:**
- Server is running locally or on a staging deployment with `SCAN_COOLDOWN_MINUTES=120` (default).
- A seeded database is present with the data described in Section 2.
- A physical USB/HID barcode scanner is available for kiosk tests, or a keyboard-emulation tool is used to simulate scanner input.
- Kiosk app is open in a Chromium browser on a display of at least 1080p.

---

## 2. Test Data Requirements

The following seed data must be present before executing a full test pass.

### 2.1 Admin Users

| Field | Value |
|-------|-------|
| Email | `admin@timely.test` |
| Password | `Test@1234` |
| Name | Test Admin |

### 2.2 Departments

| ID Alias | Name |
|----------|------|
| DEPT-1 | Engineering |
| DEPT-2 | Human Resources |
| DEPT-3 | Finance |
| DEPT-EMPTY | (empty dept — no employees assigned, for delete testing) |

### 2.3 Work Schedules

| ID Alias | Name | Start | End | Working Days |
|----------|------|-------|-----|-------------|
| SCHED-STD | Standard Office Hours | 08:00 | 17:00 | MON–FRI |
| SCHED-FLEX | Flex Schedule | 09:00 | 18:00 | MON–FRI |
| SCHED-UNUSED | Unused Schedule | 07:00 | 16:00 | MON–SAT |

### 2.4 Employees

| ID Alias | Employee Number | Name | Dept | Schedule | Status |
|----------|----------------|------|------|----------|--------|
| EMP-A | EMP-00001 | Alice Santos | Engineering | SCHED-STD | Active |
| EMP-B | EMP-00002 | Bob Reyes | Human Resources | SCHED-FLEX | Active |
| EMP-C | EMP-00003 | Carol Tan | Finance | SCHED-STD | Active |
| EMP-INACTIVE | EMP-00099 | Inactive User | Engineering | SCHED-STD | Inactive |
| EMP-NOPHOTO | EMP-00004 | David Cruz | Engineering | SCHED-STD | Active (no photo) |

### 2.5 Attendance Records (Pre-existing, for edit/report tests)

A full month of `AttendanceRecord` rows for EMP-A covering the current test month, with a mix of:
- On-time arrivals
- Late arrivals (timeIn after 08:00)
- Early departures (timeOut before 17:00)
- Days with no records (for absent detection)
- At least one record with a manual `adminNote`

---

## 3. Critical Path Test Cases

### FR-01: Employee Management

---

#### TC-01: Create Employee — All Fields Provided

| Field | Value |
|-------|-------|
| **Test ID** | TC-01 |
| **Requirement** | FR-01.1 |
| **Description** | Create a new employee with all required and optional fields. |
| **Preconditions** | Logged in as admin. DEPT-1 and SCHED-STD exist. |
| **Steps** | 1. Navigate to Employees > Add Employee. 2. Fill: Employee Number = `EMP-00010`, First Name = `Test`, Last Name = `Employee`, Department = Engineering, Schedule = Standard Office Hours, Position = `QA Tester`, Email = `test@example.com`, Phone = `09171234567`. 3. Upload a valid JPEG photo. 4. Submit. |
| **Expected Result** | Employee record is created. User is redirected to the detail page or list. New employee appears in the employee list with all fields correct. |
| **Pass Criteria** | 201 response from server. All saved field values match inputs. Photo URL is populated and renders correctly. |

---

#### TC-02: Create Employee — Required Fields Only

| Field | Value |
|-------|-------|
| **Test ID** | TC-02 |
| **Requirement** | FR-01.1, FR-01.7 |
| **Description** | Create employee with only mandatory fields. |
| **Preconditions** | Logged in as admin. |
| **Steps** | 1. Navigate to Employees > Add Employee. 2. Fill only: Employee Number, First Name, Last Name, Department, Work Schedule. 3. Leave Email, Phone, Position, Photo blank. 4. Submit. |
| **Expected Result** | Employee created. Detail page shows default avatar placeholder in place of a profile photo. |
| **Pass Criteria** | Record saved with `photoUrl = null`. Placeholder avatar renders in admin detail page and would render on kiosk. |

---

#### TC-03: Create Employee — Duplicate Employee Number

| Field | Value |
|-------|-------|
| **Test ID** | TC-03 |
| **Requirement** | FR-01.6 |
| **Description** | Attempt to create an employee with an employee number already in use. |
| **Preconditions** | EMP-A (EMP-00001) exists. |
| **Steps** | 1. Navigate to Add Employee. 2. Set Employee Number = `EMP-00001`. 3. Fill remaining required fields. 4. Submit. |
| **Expected Result** | Submission fails. A clear inline error message is displayed next to the Employee Number field (e.g., "Employee number already exists"). The record is not created. |
| **Pass Criteria** | HTTP 422 or 409 response. Form field shows validation error. No duplicate record in DB. |

---

#### TC-04: Edit Employee — Update Email and Department

| Field | Value |
|-------|-------|
| **Test ID** | TC-04 |
| **Requirement** | FR-01.2 |
| **Description** | Edit an existing employee's email and department. |
| **Preconditions** | EMP-A exists with Department = Engineering. |
| **Steps** | 1. Navigate to Employees > select EMP-A. 2. Edit: Email = `alice.new@example.com`, Department = Human Resources. 3. Save. |
| **Expected Result** | Record updates. Detail page shows new email and new department. |
| **Pass Criteria** | PATCH response 200. Values persist after page refresh. |

---

#### TC-05: Employee List — Search and Filter

| Field | Value |
|-------|-------|
| **Test ID** | TC-05 |
| **Requirement** | FR-01.3 |
| **Description** | Search by name and filter by department on the employee list page. |
| **Preconditions** | Multiple employees exist across departments. |
| **Steps** | 1. Navigate to Employees list. 2. Type "Alice" in the search box. 3. Verify only EMP-A appears. 4. Clear search. 5. Select Department filter = "Finance". 6. Verify only Finance employees appear. |
| **Expected Result** | Search and filter narrow the result set correctly. |
| **Pass Criteria** | Only matching records are displayed for each filter combination. Results match DB contents. |

---

#### TC-06: Deactivate Employee

| Field | Value |
|-------|-------|
| **Test ID** | TC-06 |
| **Requirement** | FR-01.5 |
| **Description** | Deactivate an active employee. |
| **Preconditions** | EMP-B is active. |
| **Steps** | 1. Navigate to EMP-B's detail page. 2. Click "Deactivate". 3. Confirm the action if a confirmation dialog appears. |
| **Expected Result** | EMP-B's `isActive` is set to `false`. A visual indicator (e.g., "Inactive" badge) appears on the list and detail page. |
| **Pass Criteria** | PATCH response 200. `isActive = false` in DB. Subsequent kiosk scan with EMP-B's barcode returns `NOT_FOUND` (verified by TC-29). |

---

### FR-02: Department Management

---

#### TC-07: Create Department

| Field | Value |
|-------|-------|
| **Test ID** | TC-07 |
| **Requirement** | FR-02.1 |
| **Description** | Create a new department with a unique name. |
| **Preconditions** | Logged in as admin. |
| **Steps** | 1. Navigate to Departments. 2. Click Add. 3. Enter name = `Operations`. 4. Submit. |
| **Expected Result** | Department appears in the list. |
| **Pass Criteria** | 201 response. Department with unique name persisted in DB. |

---

#### TC-08: Create Department — Duplicate Name

| Field | Value |
|-------|-------|
| **Test ID** | TC-08 |
| **Requirement** | FR-02.1 |
| **Description** | Attempt to create a department with a name that already exists. |
| **Preconditions** | Department "Engineering" (DEPT-1) exists. |
| **Steps** | 1. Navigate to Departments. 2. Click Add. 3. Enter name = `Engineering`. 4. Submit. |
| **Expected Result** | Submission rejected with a clear error message indicating the name is taken. |
| **Pass Criteria** | 422 or 409 response. No duplicate department created. Error message visible in UI. |

---

#### TC-09: Rename Department

| Field | Value |
|-------|-------|
| **Test ID** | TC-09 |
| **Requirement** | FR-02.2 |
| **Description** | Rename an existing department. |
| **Preconditions** | DEPT-3 (Finance) exists. |
| **Steps** | 1. Navigate to Departments. 2. Click edit/rename on Finance. 3. Enter new name = `Accounting`. 4. Save. |
| **Expected Result** | Department name updates to "Accounting". Employees previously in Finance are now shown under "Accounting" with no data loss. |
| **Pass Criteria** | PATCH 200. New name persisted. Employee records still reference the same department ID. |

---

#### TC-10: Delete Department — No Employees Assigned

| Field | Value |
|-------|-------|
| **Test ID** | TC-10 |
| **Requirement** | FR-02.4 |
| **Description** | Delete a department that has no active employees. |
| **Preconditions** | DEPT-EMPTY has no employees assigned. |
| **Steps** | 1. Navigate to Departments. 2. Click delete on DEPT-EMPTY. 3. Confirm. |
| **Expected Result** | Department is removed from the list. |
| **Pass Criteria** | DELETE 200. Department no longer in DB. |

---

#### TC-11: Delete Department — Active Employees Exist

| Field | Value |
|-------|-------|
| **Test ID** | TC-11 |
| **Requirement** | FR-02.4 |
| **Description** | Attempt to delete a department that has active employees assigned. |
| **Preconditions** | DEPT-1 (Engineering) has EMP-A and EMP-D assigned. |
| **Steps** | 1. Navigate to Departments. 2. Click delete on Engineering. 3. Confirm if prompted. |
| **Expected Result** | Deletion is blocked. An error message is displayed (e.g., "Cannot delete department with active employees"). |
| **Pass Criteria** | 400 or 409 response. Department still exists in DB. Error message shown in UI. |

---

### FR-03: Work Schedule Management

---

#### TC-12: Create Work Schedule

| Field | Value |
|-------|-------|
| **Test ID** | TC-12 |
| **Requirement** | FR-03.1, FR-03.4 |
| **Description** | Create a schedule with a custom name, times, and working days. |
| **Preconditions** | Logged in as admin. |
| **Steps** | 1. Navigate to Schedules > Add. 2. Enter: Name = `Night Shift`, Start = 22:00, End = 06:00, Working Days = MON, TUE, WED, THU, FRI. 3. Submit. |
| **Expected Result** | Schedule is created and visible in the list with all fields correct. |
| **Pass Criteria** | 201 response. All fields saved correctly including `workDays` array. |

---

#### TC-13: Edit Work Schedule

| Field | Value |
|-------|-------|
| **Test ID** | TC-13 |
| **Requirement** | FR-03.2 |
| **Description** | Edit start time and working days on an existing schedule. |
| **Preconditions** | SCHED-STD exists. |
| **Steps** | 1. Navigate to Schedules. 2. Edit SCHED-STD: change Start Time to 08:30, add SAT to working days. 3. Save. |
| **Expected Result** | Schedule updates. New start time of 08:30 is reflected. SAT is included in `workDays`. |
| **Pass Criteria** | PATCH 200. Values persisted. Future tardiness calculations will now use 08:30 as the baseline. |

---

#### TC-14: Delete Schedule — No Employees Assigned

| Field | Value |
|-------|-------|
| **Test ID** | TC-14 |
| **Requirement** | FR-03.5 |
| **Description** | Delete a schedule that has no employees assigned. |
| **Preconditions** | SCHED-UNUSED has no employees. |
| **Steps** | 1. Navigate to Schedules. 2. Click delete on SCHED-UNUSED. 3. Confirm. |
| **Expected Result** | Schedule removed. |
| **Pass Criteria** | DELETE 200. Schedule absent from DB and list. |

---

#### TC-15: Delete Schedule — Employees Assigned

| Field | Value |
|-------|-------|
| **Test ID** | TC-15 |
| **Requirement** | FR-03.5 |
| **Description** | Attempt to delete a schedule that has employees assigned. |
| **Preconditions** | SCHED-STD has EMP-A and EMP-C assigned. |
| **Steps** | 1. Navigate to Schedules. 2. Click delete on Standard Office Hours. 3. Confirm if prompted. |
| **Expected Result** | Deletion blocked. Error shown (e.g., "Cannot delete schedule assigned to employees"). |
| **Pass Criteria** | 400 or 409 response. Schedule still in DB. Error visible in UI. |

---

### FR-04: Attendance Viewing & Editing

---

#### TC-16: Attendance List — Filter by Date Range

| Field | Value |
|-------|-------|
| **Test ID** | TC-16 |
| **Requirement** | FR-04.1 |
| **Description** | Filter the attendance list by a specific date range. |
| **Preconditions** | Attendance records exist for current month. |
| **Steps** | 1. Navigate to Attendance. 2. Set date range filter: From = first day of current month, To = today. 3. Apply filter. |
| **Expected Result** | Only records within the selected date range are shown. No records from prior months appear. |
| **Pass Criteria** | All displayed records have `date` within the specified range. |

---

#### TC-17: Attendance List — Filter by Late Flag

| Field | Value |
|-------|-------|
| **Test ID** | TC-17 |
| **Requirement** | FR-04.1 |
| **Description** | Filter attendance records to show only late employees. |
| **Preconditions** | At least one record with `isLate = true` exists. |
| **Steps** | 1. Navigate to Attendance. 2. Enable "Late" filter. 3. Apply. |
| **Expected Result** | Only records with `isLate = true` are shown. |
| **Pass Criteria** | Every visible record has the "Late" flag indicator. |

---

#### TC-18: Edit Attendance — Make Employee Late

| Field | Value |
|-------|-------|
| **Test ID** | TC-18 |
| **Requirement** | FR-04.3, FR-04.4 |
| **Description** | Edit a timeIn to a time after the scheduled start — verify isLate and lateMinutes recalculate. |
| **Preconditions** | EMP-A has an attendance record where original timeIn was 08:00 (on time) and schedule start is 08:00. |
| **Steps** | 1. Navigate to Attendance. 2. Open edit modal for EMP-A's record. 3. Change timeIn to `08:45`. 4. Save. |
| **Expected Result** | Record saves. `isLate = true`. `lateMinutes = 45`. `totalHoursWorked` recalculated from new timeIn. |
| **Pass Criteria** | DB reflects `isLate = true`, `lateMinutes = 45`. UI attendance list shows the Late flag on the updated record. |

---

#### TC-19: Edit Attendance — Cause Undertime

| Field | Value |
|-------|-------|
| **Test ID** | TC-19 |
| **Requirement** | FR-04.3, FR-04.4 |
| **Description** | Edit a timeOut to a time before the scheduled end — verify isUndertime and undertimeMinutes recalculate. |
| **Preconditions** | EMP-A has a record where original timeOut was 17:00 (on time) and schedule end is 17:00. |
| **Steps** | 1. Open edit modal for that record. 2. Change timeOut to `16:15`. 3. Save. |
| **Expected Result** | `isUndertime = true`. `undertimeMinutes = 45`. `totalHoursWorked` recalculated. |
| **Pass Criteria** | DB reflects correct values. Undertime flag visible in attendance list. |

---

#### TC-20: Edit Attendance — Clear timeOut

| Field | Value |
|-------|-------|
| **Test ID** | TC-20 |
| **Requirement** | FR-04.3, FR-04.4 |
| **Description** | Clear (null out) the timeOut on a record that has one. |
| **Preconditions** | EMP-A has a record with both timeIn and timeOut populated. |
| **Steps** | 1. Open edit modal for the record. 2. Clear/remove the timeOut value. 3. Save. |
| **Expected Result** | `timeOut = null`. `totalHoursWorked = null`. `isUndertime = false`. `undertimeMinutes = 0`. |
| **Pass Criteria** | DB values match expected. UI shows the record as having no timeOut. |

---

#### TC-21: Edit Attendance — Add Admin Note

| Field | Value |
|-------|-------|
| **Test ID** | TC-21 |
| **Requirement** | FR-04.5 |
| **Description** | Add an adminNote to a record during an edit. |
| **Preconditions** | Any attendance record with no existing adminNote. |
| **Steps** | 1. Open edit modal. 2. Enter adminNote = `Manual correction — scanner malfunction`. 3. Save timeIn/timeOut unchanged. |
| **Expected Result** | `adminNote` saved in DB. Note is visible on the record in the attendance detail/list view. |
| **Pass Criteria** | `adminNote` field in DB matches entered text. |

---

#### TC-22: Attendance Log — Read-Only Audit View

| Field | Value |
|-------|-------|
| **Test ID** | TC-22 |
| **Requirement** | FR-04.6 |
| **Description** | View raw scan logs; confirm they are not editable. |
| **Preconditions** | Scan events have been generated (e.g., from TC-24 and TC-25). |
| **Steps** | 1. Navigate to Attendance > Logs (audit view). 2. Verify scan entries appear with scannedAt, type (IN/OUT), and employee info. 3. Attempt to find any edit control. |
| **Expected Result** | Logs are displayed. No edit, delete, or modify actions are present. |
| **Pass Criteria** | UI contains no edit controls for log entries. Log data matches raw DB `AttendanceLog` entries. |

---

### FR-05: Reports

---

#### TC-23: Daily Summary — All Employees Present/Absent

| Field | Value |
|-------|-------|
| **Test ID** | TC-23 |
| **Requirement** | FR-05.1, FR-05.4 |
| **Description** | View daily summary for a date where some employees have attendance and some do not. |
| **Preconditions** | On the selected test date: EMP-A and EMP-B have attendance records; EMP-C does not. |
| **Steps** | 1. Navigate to Reports > Daily Summary. 2. Select the test date. 3. View results. |
| **Expected Result** | EMP-A and EMP-B show as "Present" (with Late flag if applicable). EMP-C shows as "Absent". All active employees appear in the list. |
| **Pass Criteria** | Every active employee appears in the report. Status matches their attendance record or absence for that day. |

---

#### TC-24: Daily Summary — Day With Zero Attendance

| Field | Value |
|-------|-------|
| **Test ID** | TC-24 |
| **Requirement** | FR-05.1 |
| **Description** | View daily summary for a date with no attendance records for any employee (e.g., a future date or a known off day). |
| **Preconditions** | No attendance records exist for the selected date. |
| **Steps** | 1. Navigate to Reports > Daily Summary. 2. Select a date with no records. 3. View results. |
| **Expected Result** | All active employees appear with status "Absent". |
| **Pass Criteria** | Report shows all active employees listed as Absent. No errors or empty-state blanks. |

---

#### TC-25: Monthly DTR — Totals Match Row Sum

| Field | Value |
|-------|-------|
| **Test ID** | TC-25 |
| **Requirement** | FR-05.1 |
| **Description** | Verify that the monthly DTR totals row equals the sum of individual day values. |
| **Preconditions** | EMP-A has a full month of attendance records with varied late/undertime entries. |
| **Steps** | 1. Navigate to Reports > Monthly DTR. 2. Select EMP-A and the test month/year. 3. View the calendar table and the totals row. 4. Manually sum the lateMinutes column from each row. |
| **Expected Result** | The totals row value for lateMinutes equals the sum of all individual row lateMinutes. Same verification for undertimeMinutes, totalHoursWorked, and days present. |
| **Pass Criteria** | Totals row matches manual sum for all four aggregated fields. Deviation of zero is required (floating-point rounding aside — max 0.01 hr tolerance for totalHoursWorked). |

---

#### TC-26: Monthly DTR — Employee With No Records

| Field | Value |
|-------|-------|
| **Test ID** | TC-26 |
| **Requirement** | FR-05.1 |
| **Description** | Generate a monthly DTR for an employee who has no attendance records in the selected month. |
| **Preconditions** | EMP-B has no records for a prior month (e.g., last month before system go-live). |
| **Steps** | 1. Navigate to Reports > Monthly DTR. 2. Select EMP-B and a month with no records. 3. View report. |
| **Expected Result** | Report shows all calendar days in the month. Each day row shows empty timeIn/timeOut. Totals row shows zeroes. No error. |
| **Pass Criteria** | Report renders without errors. All days are listed. Totals = 0/0/0/0. |

---

#### TC-27: Late/Undertime Report — Sorted Correctly

| Field | Value |
|-------|-------|
| **Test ID** | TC-27 |
| **Requirement** | FR-05.1 |
| **Description** | View the late/undertime report and verify sorting by late minutes. |
| **Preconditions** | Multiple attendance records with varying lateMinutes exist in the current month. |
| **Steps** | 1. Navigate to Reports > Late/Undertime. 2. Set date range to current month. 3. Click the "Late Minutes" column header to sort descending. |
| **Expected Result** | Records re-order from highest to lowest lateMinutes. |
| **Pass Criteria** | First row has the highest lateMinutes value. Descending order is consistent. |

---

#### TC-28: CSV Export — Output Matches Displayed Data

| Field | Value |
|-------|-------|
| **Test ID** | TC-28 |
| **Requirement** | FR-05.2 |
| **Description** | Export a report as CSV and verify it contains all rows and columns shown in the UI. |
| **Preconditions** | Daily summary report is loaded for a date with at least 3 employees. |
| **Steps** | 1. Load Daily Summary for the test date. 2. Click "Export CSV". 3. Open the downloaded file. 4. Count rows and compare column headers and values against the displayed table. |
| **Expected Result** | CSV contains a header row and one data row per employee displayed in the table. All column values match the UI. No extra or missing rows. |
| **Pass Criteria** | Row count (excluding header) equals number of employees shown in UI. Every visible cell value appears verbatim in the CSV. |

---

### FR-06: Barcode Scan Interface (Kiosk)

---

#### TC-29: Idle State Display

| Field | Value |
|-------|-------|
| **Test ID** | TC-29 |
| **Requirement** | FR-06.1, FR-06.7 |
| **Description** | Verify the kiosk idle screen displays correctly with no extraneous UI. |
| **Preconditions** | Kiosk app is loaded in a fullscreen Chromium window. No scan has occurred recently. |
| **Steps** | 1. Open kiosk app. 2. Wait 10 seconds without scanning. 3. Observe the screen. |
| **Expected Result** | Full-screen idle state shows: current date, live digital clock updating every second, and a scan prompt. No sidebar, no navigation, no login form, no mouse-interactive elements. |
| **Pass Criteria** | Clock increments each second. No browser UI chrome visible. No non-kiosk UI elements present. |

---

#### TC-30: Successful TIME IN Scan

| Field | Value |
|-------|-------|
| **Test ID** | TC-30 |
| **Requirement** | FR-06.3, FR-06.4 |
| **Description** | Scan EMP-A's barcode when they have no attendance entry today. |
| **Preconditions** | EMP-A has no `AttendanceLog` entries for today. |
| **Steps** | 1. Trigger barcode scan for `EMP-00001` via scanner or keyboard-emulation tool. |
| **Expected Result** | Feedback card appears within 1 second showing: Alice Santos' name, profile photo, current time, green "TIME IN" badge. After 4–5 seconds, screen auto-returns to idle. |
| **Pass Criteria** | `AttendanceLog { type: IN }` created in DB. `AttendanceRecord { timeIn: now }` upserted. Feedback auto-dismisses within 4–5 seconds. |

---

#### TC-31: Successful TIME OUT Scan

| Field | Value |
|-------|-------|
| **Test ID** | TC-31 |
| **Requirement** | FR-06.3 |
| **Description** | Scan EMP-A's barcode after the cooldown window has expired. |
| **Preconditions** | EMP-A has a TIME IN log entry from more than `SCAN_COOLDOWN_MINUTES` minutes ago (use a shortened cooldown in test env, or pre-seed the log with a past timestamp). |
| **Steps** | 1. Trigger scan for `EMP-00001`. |
| **Expected Result** | Feedback card shows blue "TIME OUT" badge. Employee name and current time displayed. Auto-dismisses. |
| **Pass Criteria** | `AttendanceLog { type: OUT }` created. `AttendanceRecord { timeOut: now }` updated. `totalHoursWorked` computed and saved. |

---

#### TC-32: ALREADY RECORDED — Scan Within Cooldown

| Field | Value |
|-------|-------|
| **Test ID** | TC-32 |
| **Requirement** | FR-06.6, FR-07 |
| **Description** | Scan within the cooldown window after TIME IN. |
| **Preconditions** | EMP-A has a TIME IN log entry from less than `SCAN_COOLDOWN_MINUTES` minutes ago. |
| **Steps** | 1. Trigger scan for `EMP-00001` within the cooldown window. |
| **Expected Result** | Orange "Already Recorded" feedback shown with the last scan time. Auto-dismisses. |
| **Pass Criteria** | No new `AttendanceLog` created (or if logged per FR-07.3, type is preserved without affecting the record). `AttendanceRecord` timeIn/timeOut unchanged. |

---

#### TC-33: NOT FOUND — Invalid Employee Number

| Field | Value |
|-------|-------|
| **Test ID** | TC-33 |
| **Requirement** | FR-06.5 |
| **Description** | Scan a barcode for an employee number that does not exist in the system. |
| **Preconditions** | No employee with number `EMP-99999` exists. |
| **Steps** | 1. Trigger scan for `EMP-99999`. |
| **Expected Result** | Red "Employee not found" error state displayed. Auto-dismisses. |
| **Pass Criteria** | No DB records created. Error state shown within 1 second. |

---

#### TC-34: NOT FOUND — Deactivated Employee

| Field | Value |
|-------|-------|
| **Test ID** | TC-34 |
| **Requirement** | FR-01.5, FR-06.5 |
| **Description** | Scan a barcode for a deactivated employee. |
| **Preconditions** | EMP-INACTIVE (`EMP-00099`) has `isActive = false`. |
| **Steps** | 1. Trigger scan for `EMP-00099`. |
| **Expected Result** | Red "Employee not found" error state displayed. Deactivated employee is treated identically to a non-existent one. |
| **Pass Criteria** | `NOT_FOUND` response from server. No attendance record created. |

---

#### TC-35: Photo Placeholder on Kiosk

| Field | Value |
|-------|-------|
| **Test ID** | TC-35 |
| **Requirement** | FR-01.7, FR-06.3 |
| **Description** | Scan for an employee with no profile photo and verify the placeholder renders. |
| **Preconditions** | EMP-NOPHOTO (`EMP-00004`) has `photoUrl = null`. No prior scan today. |
| **Steps** | 1. Trigger scan for `EMP-00004`. |
| **Expected Result** | Feedback card shows the default avatar placeholder instead of a broken image. Employee name, time, and TIME IN badge show correctly. |
| **Pass Criteria** | No broken image icon. Placeholder avatar renders visually. |

---

### FR-07: Accidental Scan Prevention

---

#### TC-36: First Scan of Day — TIME IN

| Field | Value |
|-------|-------|
| **Test ID** | TC-36 |
| **Requirement** | FR-07 |
| **Description** | Verify the first scan of the day always produces TIME IN. |
| **Preconditions** | EMP-A has no `AttendanceLog` entry for today. |
| **Steps** | 1. Trigger scan for `EMP-00001`. |
| **Expected Result** | Response: `{ status: "TIME_IN" }`. DB: `AttendanceLog { type: IN }` created. `AttendanceRecord { timeIn }` upserted. |
| **Pass Criteria** | Status = TIME_IN. Single AttendanceLog row for today with type = IN. |

---

#### TC-37: Second Scan Within Cooldown — ALREADY RECORDED

| Field | Value |
|-------|-------|
| **Test ID** | TC-37 |
| **Requirement** | FR-07, FR-07.1 |
| **Description** | Scan again within the cooldown window — must be rejected. |
| **Preconditions** | EMP-A scanned IN less than `SCAN_COOLDOWN_MINUTES` minutes ago (e.g., 1 minute). |
| **Steps** | 1. Wait 60 seconds after TC-36. 2. Trigger scan for `EMP-00001` again. |
| **Expected Result** | Response: `{ status: "ALREADY_RECORDED", lastScan: <timestamp> }`. No new AttendanceLog created. |
| **Pass Criteria** | Status = ALREADY_RECORDED. AttendanceRecord.timeIn unchanged. `lastScan` timestamp matches the original IN entry. |

---

#### TC-38: Scan After Cooldown Expires — TIME OUT

| Field | Value |
|-------|-------|
| **Test ID** | TC-38 |
| **Requirement** | FR-07 |
| **Description** | Scan after cooldown window has elapsed — must produce TIME OUT. |
| **Preconditions** | EMP-A's last scan was at least `SCAN_COOLDOWN_MINUTES` minutes ago. (For testing: set `SCAN_COOLDOWN_MINUTES=1` in test env, or pre-seed a log entry with a past timestamp.) |
| **Steps** | 1. Ensure cooldown has elapsed. 2. Trigger scan for `EMP-00001`. |
| **Expected Result** | Response: `{ status: "TIME_OUT" }`. `AttendanceRecord { timeOut, totalHoursWorked, isUndertime, undertimeMinutes }` updated. |
| **Pass Criteria** | Status = TIME_OUT. DB reflects correct timeOut and computed fields. |

---

#### TC-39: Double Scan Within Milliseconds (Scanner Double-Emit)

| Field | Value |
|-------|-------|
| **Test ID** | TC-39 |
| **Requirement** | FR-07, FR-07.2 |
| **Description** | Simulate a barcode scanner emitting the same barcode twice in rapid succession (< 500ms apart). |
| **Preconditions** | EMP-C has no scan entry today. Server has default cooldown. Cooldown logic is enforced server-side. |
| **Steps** | 1. Send two POST /attendance/scan requests for `EMP-00003` within 200ms of each other (automated test). |
| **Expected Result** | First request → TIME_IN. Second request → ALREADY_RECORDED. Only one `AttendanceLog { type: IN }` record exists for today. |
| **Pass Criteria** | Exactly one TIME_IN AttendanceLog entry. No TIME_OUT or duplicate TIME_IN entries. No race condition producing two AttendanceRecords. |

---

#### TC-40: Midnight Boundary — Scan at 23:59 and 00:01

| Field | Value |
|-------|-------|
| **Test ID** | TC-40 |
| **Requirement** | FR-07 |
| **Description** | Verify that a scan at 23:59 and a scan at 00:01 (next calendar day) are treated as independent events on separate dates. |
| **Preconditions** | EMP-C has no scan entries for either day. Test environment allows manipulating clock or pre-seeding records with specific timestamps. |
| **Steps** | 1. Create an `AttendanceLog` for EMP-C at 23:59 today (via seed or time manipulation). 2. Trigger a scan for EMP-C at 00:01 the next calendar day. |
| **Expected Result** | The 00:01 scan is treated as the first scan of the new day and produces TIME_IN, not TIME_OUT or ALREADY_RECORDED. The two days have independent AttendanceRecord rows. |
| **Pass Criteria** | Two separate AttendanceRecord rows: one for day D with only timeIn set, one for day D+1 with only timeIn set. `@@unique([employeeId, date])` constraint not violated. |

---

#### TC-41: Cooldown Is Configurable Via Environment Variable

| Field | Value |
|-------|-------|
| **Test ID** | TC-41 |
| **Requirement** | FR-07.1 |
| **Description** | Verify that changing `SCAN_COOLDOWN_MINUTES` to a non-default value takes effect. |
| **Preconditions** | Test environment. Server restarted with `SCAN_COOLDOWN_MINUTES=1`. |
| **Steps** | 1. Scan EMP-B (TIME_IN). 2. Wait 90 seconds. 3. Scan EMP-B again. |
| **Expected Result** | The second scan (90s > 1 minute cooldown) returns TIME_OUT instead of ALREADY_RECORDED. |
| **Pass Criteria** | Status = TIME_OUT with `SCAN_COOLDOWN_MINUTES=1`. Confirms the env variable is read at runtime and not hardcoded. |

---

#### TC-42: All Scan Events Logged Including Ignored Ones

| Field | Value |
|-------|-------|
| **Test ID** | TC-42 |
| **Requirement** | FR-07.3 |
| **Description** | Verify that even ALREADY_RECORDED scans are persisted to AttendanceLog for audit purposes. |
| **Preconditions** | EMP-A has a recent TIME_IN entry within the cooldown window. |
| **Steps** | 1. Trigger 3 scans for EMP-A within the cooldown window (all should return ALREADY_RECORDED). 2. Navigate to Admin > Attendance Logs. |
| **Expected Result** | All scan events appear in the AttendanceLog audit view, including the repeated/ignored scans. |
| **Pass Criteria** | At least 4 total log entries visible for EMP-A on that day (1 original IN + 3 ignored). Note: the BRD states "all scan events including ignored ones" must be logged — this must be confirmed against implementation. |

---

## 4. Edge Cases & Boundary Conditions

---

#### TC-43: Employee Creation — Missing Required Field

| Field | Value |
|-------|-------|
| **Test ID** | TC-43 |
| **Description** | Submit the create employee form with a required field left blank. |
| **Steps** | 1. Navigate to Add Employee. 2. Leave First Name blank. 3. Submit. |
| **Expected Result** | Form-level validation prevents submission. Error shown on the First Name field. |
| **Pass Criteria** | No API call made (client-side Zod validation). Or API returns 422 with field-level error. |

---

#### TC-44: Pagination — First Page

| Field | Value |
|-------|-------|
| **Test ID** | TC-44 |
| **Description** | Verify employee list page 1 loads correctly and shows the correct number of rows. |
| **Preconditions** | More than one page of employees exist (e.g., >10 if page size is 10). |
| **Steps** | 1. Navigate to Employees. 2. Observe page 1. |
| **Expected Result** | First page shows exactly the page-size number of employees. Previous button is disabled. |
| **Pass Criteria** | Row count matches page size. Pagination controls show page 1 of N. |

---

#### TC-45: Pagination — Last Page

| Field | Value |
|-------|-------|
| **Test ID** | TC-45 |
| **Description** | Navigate to the last page of the employee list. |
| **Steps** | 1. Click Next until the last page. |
| **Expected Result** | Last page shows the remaining employees (may be fewer than page size). Next button is disabled. |
| **Pass Criteria** | No blank rows or errors. Next button disabled. Total count across all pages equals total employee count. |

---

#### TC-46: Pagination — Page Beyond Last

| Field | Value |
|-------|-------|
| **Test ID** | TC-46 |
| **Description** | Attempt to load a page number beyond the total page count via URL manipulation (e.g., `?page=9999`). |
| **Steps** | 1. Manually type `?page=9999` in the browser URL on the employee list. |
| **Expected Result** | Page shows an empty state or redirects to page 1. No server error (500). |
| **Pass Criteria** | 200 response with empty results or page 1 fallback. No crash. |

---

#### TC-47: Empty State — No Employees

| Field | Value |
|-------|-------|
| **Test ID** | TC-47 |
| **Description** | View the employee list when no employees exist. |
| **Preconditions** | All employees deleted or system freshly seeded with none. |
| **Steps** | 1. Navigate to Employees. |
| **Expected Result** | A meaningful empty state message (e.g., "No employees found") rather than an error or blank table. |
| **Pass Criteria** | No JavaScript errors. Empty state message visible. Table headers still render. |

---

#### TC-48: Empty State — No Attendance Records

| Field | Value |
|-------|-------|
| **Test ID** | TC-48 |
| **Description** | View the attendance list when no records exist. |
| **Preconditions** | Attendance table is empty. |
| **Steps** | 1. Navigate to Attendance. |
| **Expected Result** | Empty state message shown. No errors. |
| **Pass Criteria** | UI renders without error. Clear empty state messaging. |

---

#### TC-49: Scan With Empty Barcode String

| Field | Value |
|-------|-------|
| **Test ID** | TC-49 |
| **Description** | POST /attendance/scan with an empty or whitespace-only employeeNumber. |
| **Steps** | 1. Send POST /attendance/scan with body `{ "employeeNumber": "" }`. |
| **Expected Result** | Server returns 400 Bad Request with a validation error. |
| **Pass Criteria** | 400 response. No DB records created. |

---

#### TC-50: Attendance Record Uniqueness Constraint

| Field | Value |
|-------|-------|
| **Test ID** | TC-50 |
| **Description** | Verify the `@@unique([employeeId, date])` constraint on AttendanceRecord prevents duplicate records for the same employee and date. |
| **Steps** | 1. Attempt to insert two AttendanceRecord rows with the same `employeeId` and `date` directly or via back-to-back scan requests. |
| **Expected Result** | Second insert is rejected by the database constraint. Server handles this gracefully (no 500 crash — returns appropriate error or uses upsert correctly). |
| **Pass Criteria** | Only one AttendanceRecord per employee per date. No unhandled DB constraint error. |

---

#### TC-51: Profile Photo — Invalid File Type

| Field | Value |
|-------|-------|
| **Test ID** | TC-51 |
| **Description** | Attempt to upload a non-image file (e.g., a PDF) as a profile photo. |
| **Steps** | 1. On Create/Edit Employee form, attempt to select a .pdf file for the photo upload field. |
| **Expected Result** | Upload rejected. Error message displayed (e.g., "Only image files are accepted"). |
| **Pass Criteria** | No broken photoUrl saved. Error shown in UI. |

---

#### TC-52: Barcode With Special Characters

| Field | Value |
|-------|-------|
| **Test ID** | TC-52 |
| **Description** | Scan a barcode containing special characters (e.g., hyphens, which are present in the example `EMP-00001`). |
| **Preconditions** | Employee with number `EMP-00001` exists. |
| **Steps** | 1. Trigger scan for `EMP-00001` (contains a hyphen). |
| **Expected Result** | System processes the barcode correctly. Hyphen is not stripped or misinterpreted. Employee found and TIME IN recorded. |
| **Pass Criteria** | Successful TIME_IN response. Correct employee identified. |

---

## 5. Non-Functional Test Cases

---

#### TC-53: NFR-01 — Kiosk Scan Round-Trip Under 1 Second

| Field | Value |
|-------|-------|
| **Test ID** | TC-53 |
| **Requirement** | NFR-01 |
| **Description** | Measure end-to-end scan response time on a local network. |
| **Preconditions** | Server running on local network. Kiosk on the same network. |
| **Steps** | 1. Instrument the kiosk `handleScan` function with `performance.now()` timestamps. 2. Trigger 10 consecutive scans (alternating employees to avoid cooldown). 3. Record the time from scan completion to feedback card appearing. |
| **Expected Result** | All 10 scan round-trips complete in under 1000ms. |
| **Pass Criteria** | Max round-trip across all samples < 1000ms. p95 < 800ms recommended. |

---

#### TC-54: NFR-04 — Rate Limiting on Scan Endpoint

| Field | Value |
|-------|-------|
| **Test ID** | TC-54 |
| **Requirement** | NFR-04 |
| **Description** | Flood the scan endpoint with 50 requests within 1 second to verify rate limiting is active. |
| **Steps** | 1. Using a load testing tool (e.g., `autocannon`, `k6`, or a custom script), send 50 POST /attendance/scan requests concurrently in under 1 second. |
| **Expected Result** | After the rate limit threshold is exceeded, subsequent requests receive HTTP 429 (Too Many Requests). Requests within the limit are processed normally. |
| **Pass Criteria** | At least some responses return 429. Server does not crash or return 500. Rate limit is enforced. |

---

#### TC-55: NFR-04 — Expired JWT Redirects to Login

| Field | Value |
|-------|-------|
| **Test ID** | TC-55 |
| **Requirement** | NFR-04 |
| **Description** | Simulate an expired JWT token and verify the admin app redirects to the login page. |
| **Steps** | 1. Log in to the Admin App. 2. Manually edit the JWT token in localStorage to an expired value (or wait for natural expiry if token lifetime is short). 3. Navigate to any protected page (e.g., Employees). |
| **Expected Result** | The 401 response from the API triggers an automatic redirect to `/login` (or `/logout`). |
| **Pass Criteria** | User sees the login page. No protected data rendered. Axios interceptor handles 401 redirect as documented in CLAUDE.md. |

---

#### TC-56: NFR-04 — Kiosk Scan Endpoint Requires No Auth

| Field | Value |
|-------|-------|
| **Test ID** | TC-56 |
| **Requirement** | NFR-04 |
| **Description** | Confirm that POST /attendance/scan works without an Authorization header. |
| **Steps** | 1. Send POST /attendance/scan with a valid employeeNumber and no Authorization header. |
| **Expected Result** | Request processes normally and returns TIME_IN, TIME_OUT, or ALREADY_RECORDED. |
| **Pass Criteria** | 200 response with scan result. No 401 or 403. |

---

#### TC-57: NFR-04 — Protected Admin Endpoints Require Auth

| Field | Value |
|-------|-------|
| **Test ID** | TC-57 |
| **Requirement** | NFR-04 |
| **Description** | Confirm that admin endpoints reject requests without a valid JWT. |
| **Steps** | 1. Send GET /employees without an Authorization header. 2. Send GET /employees with a malformed token. |
| **Expected Result** | Both requests receive HTTP 401. |
| **Pass Criteria** | 401 response in both cases. No employee data returned. |

---

#### TC-58: NFR-06 — Kiosk Legibility Checklist

| Field | Value |
|-------|-------|
| **Test ID** | TC-58 |
| **Requirement** | NFR-06 |
| **Description** | Visual review of kiosk UI legibility at 2–3 meters from a 1080p or larger display. |
| **Steps** | 1. Stand 2–3 meters from the kiosk display. 2. Trigger a TIME IN scan. 3. Assess each visual element using the checklist below. |

**Legibility Checklist:**

| Item | Criteria | Pass/Fail |
|------|----------|-----------|
| Idle clock | Digits readable without squinting | |
| Idle prompt text | Full sentence readable at distance | |
| Idle date | Date clearly visible | |
| Feedback: Employee name | Name readable in large text | |
| Feedback: TIME IN badge | Badge color (green) and label legible | |
| Feedback: TIME OUT badge | Badge color (blue) and label legible | |
| Feedback: ALREADY RECORDED badge | Badge color (orange) and label legible | |
| Feedback: NOT FOUND state | Red error state clearly readable | |
| Profile photo | Photo or placeholder clearly visible | |
| Current time on feedback | Time digits readable | |

**Pass Criteria:** All checklist items pass. No item marked Fail.

---

#### TC-59: NFR-02 — Kiosk Recovers After Browser Refresh

| Field | Value |
|-------|-------|
| **Test ID** | TC-59 |
| **Requirement** | NFR-02 |
| **Description** | Reload the kiosk browser page and verify it returns to a functional idle state. |
| **Steps** | 1. Trigger a scan (TIME IN). 2. Immediately refresh the browser (F5). 3. Trigger another scan for the same employee. |
| **Expected Result** | After refresh, the kiosk shows the idle state and correctly responds to the new scan (should be ALREADY_RECORDED since TIME IN was already saved server-side). |
| **Pass Criteria** | Kiosk returns to idle state without manual intervention. Scan response is correct based on server-side state. No client-side state that could cause incorrect behavior. |

---

## 6. Regression Checklist

Run this checklist after every significant change (new feature merge, schema migration, or server restart).

### Authentication
- [ ] Admin can log in with valid credentials
- [ ] Invalid password returns an error; no token issued
- [ ] Expired/invalid JWT on protected endpoint returns 401
- [ ] Logout clears token and redirects to login

### Employee Management
- [ ] Create employee with all fields succeeds
- [ ] Duplicate employeeNumber is rejected
- [ ] Edit employee saves changes correctly
- [ ] Deactivate employee prevents kiosk scan (returns NOT_FOUND)
- [ ] Default avatar shown when no photo is set

### Department Management
- [ ] Create department succeeds
- [ ] Duplicate department name is rejected
- [ ] Delete department with active employees is blocked
- [ ] Delete empty department succeeds

### Work Schedule Management
- [ ] Create schedule with all working days succeeds
- [ ] Edit schedule persists new times and working days
- [ ] Delete schedule with assigned employees is blocked
- [ ] Delete unassigned schedule succeeds

### Kiosk Scan Flow
- [ ] First scan of day → TIME IN (with correct employee info on card)
- [ ] Scan within cooldown → ALREADY RECORDED (with last scan time)
- [ ] Scan after cooldown → TIME OUT (with computed fields saved)
- [ ] Invalid employee number → NOT FOUND
- [ ] Deactivated employee → NOT FOUND
- [ ] Feedback auto-dismisses within 5 seconds
- [ ] Kiosk returns to idle state after dismissal

### Attendance Records
- [ ] Edit timeIn recalculates isLate and lateMinutes correctly
- [ ] Edit timeOut recalculates isUndertime and undertimeMinutes correctly
- [ ] Clearing timeOut sets totalHoursWorked to null
- [ ] Admin note saves and is visible on the record
- [ ] Raw AttendanceLog audit view is read-only

### Reports
- [ ] Daily summary shows all active employees (Present or Absent)
- [ ] Monthly DTR totals row matches sum of individual rows
- [ ] Late/Undertime report returns only records with flags set
- [ ] CSV export file contains all rows and columns matching UI

### Non-Functional
- [ ] Kiosk scan round-trip completes in < 1 second
- [ ] Scan endpoint accessible without authentication
- [ ] Admin endpoints reject requests without valid JWT

---

## 7. Known Risks & QA Concerns

### 7.1 Ambiguous Requirements

| # | Concern | Location | Risk |
|---|---------|----------|------|
| R-01 | **FR-07.3 says all scan events including "ignored" ones must be logged**, but the data model for `AttendanceLog` only has types `IN` and `OUT`. It is unclear what `type` should be used for ALREADY_RECORDED events. A third type (e.g., `IGNORED` or `DUPLICATE`) is not defined in the BRD schema. This could cause audit logs to appear as false OUT events. | BRD Section 8, FR-07.3 | High |
| R-02 | **Undertime calculation on TIME OUT scan**: The BRD (FR-07, step 4) says recalculate undertime at the moment of TIME OUT. But if an employee leaves early, `undertimeMinutes` is negative-adjacent — it is unclear whether the system should also flag TIME OUT scans that are *later* than the schedule end time. An employee staying late should not be flagged as undertime, but the BRD does not explicitly address the "working overtime but not tracking overtime" case. | BRD FR-07, FR-03.6 | Medium |
| R-03 | **Tardiness on non-working days**: If an employee assigned to a MON–FRI schedule scans in on a Saturday, the system should not flag them as late (since Saturday is not a working day). The BRD does not explicitly specify what happens when a scan occurs outside the scheduled working days. | BRD FR-03.6, FR-07 | Medium |
| R-04 | **The "On Leave" status** is listed as a manual flag in the Daily Summary report (FR-05 Report 1), but leave management is listed as Out of Scope (Section 11). There is no mechanism defined to set this flag. Clarify whether "On Leave" status in the daily summary is expected in v1 or is a future placeholder. | BRD FR-05, Section 11 | Medium |
| R-05 | **Multiple TIME OUT scans**: After a successful TIME OUT, if the same employee scans again after the cooldown window again, the system logic (step 4) would create another OUT log and update the `AttendanceRecord` with a new timeOut. This is valid (e.g., forgot something, returned), but could produce unexpected results. The BRD does not cap the number of OUT events per day. | BRD FR-07 | Medium |

### 7.2 Undertested Areas in Development Plan

| # | Concern | Location |
|---|---------|----------|
| R-06 | **Phase 4 (scan logic) has no unit test specification**. The cooldown logic is the most business-critical piece of the system, but the development plan does not include explicit unit tests for the scan service. The NestJS server supports `npm run test` — the cooldown boundary conditions (exactly at the boundary, 1ms before, 1ms after) should have dedicated unit tests. | DEVELOPMENT_PLAN Phase 4 |
| R-07 | **Concurrency / race condition** on double-scan (TC-39): Two requests arriving simultaneously for the same employee with no logs today could both read "no entry" and both create a TIME_IN. The dev plan does not mention database-level locking or upsert strategies to prevent this. | DEVELOPMENT_PLAN Phase 4, Step 4.4 |
| R-08 | **Timezone handling**: BRD Assumption A6 says all times are in the server's local timezone. But the `AttendanceRecord.date` is stored as `@db.Date` (date-only). If the server's timezone is offset from UTC, a scan at 23:00 local time could store as a different calendar date in UTC. This is a common source of off-by-one date bugs. | BRD Section 8, A6 |
| R-09 | **CSV export correctness for large datasets**: The dev plan defers CSV export to a frontend utility (`@repo/utilities`). If CSV generation is purely client-side, it may time out or produce truncated files for large datasets (e.g., a yearly DTR with 50 employees). | DEVELOPMENT_PLAN Phase 12 |
| R-10 | **Profile photo storage strategy** is unresolved: Phase 3.14 mentions "store URL in `photoUrl`; use file storage or base64" without committing to an approach. Base64-in-DB can significantly inflate row sizes and slow the kiosk's API response. This should be resolved before implementation. | DEVELOPMENT_PLAN Phase 3.14 |

### 7.3 Integration Points Likely to Break

| # | Integration Point | Concern |
|---|-------------------|---------|
| R-11 | **Kiosk barcode detection (`use-scan-detection` hook)** may misfire if the kiosk terminal receives keyboard events from an on-screen keyboard, browser autofill, or the OS. Any non-scanner keyboard input on the kiosk terminal could be interpreted as a partial or complete barcode. | BRD Section 10 |
| R-12 | **Prisma `upsert` on AttendanceRecord**: The scan logic uses upsert with `@@unique([employeeId, date])`. If the timezone conversion causes `date` to differ between the IN and OUT scans (e.g., employee scans IN at 23:58 and OUT after midnight), the upsert will not find the original record and will create a new one — causing the OUT log to be orphaned from the IN record. | BRD Section 8 |
| R-13 | **CORS configuration**: The server must allow both `http://localhost:5174` and `http://localhost:5175` origins. If CORS is misconfigured, kiosk scans or admin API calls will fail silently in production. Phase 0.11 addresses this, but it is a common environment-specific failure. | DEVELOPMENT_PLAN Phase 0.11 |
| R-14 | **JWT expiry UX in Admin App**: The axios interceptor (from `@repo/app-providers`) redirects to `/logout` on 401/403. If the JWT expires mid-session while the admin has unsaved form changes (e.g., mid-edit on an attendance record), all unsaved data will be lost. There is no session refresh or "re-authenticate" flow defined. | BRD NFR-04, CLAUDE.md |
| R-15 | **AttendanceRecord recalculation on admin edit (FR-04.4)**: The recalculation must use the employee's *current* schedule. If the admin changes an employee's schedule after historical attendance records exist, those old records will not be retroactively recalculated — but future edits to those old records will use the *new* schedule. This could produce historically inconsistent lateMinutes values. The BRD does not address this scenario. | BRD FR-04.4, FR-03.6 |
