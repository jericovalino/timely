import "./print.css";
import { useState, useMemo } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import {
  LuChartBar,
  LuCalendarDays,
  LuClock,
  LuPrinter,
  LuDownload,
} from "react-icons/lu";

import {
  Table,
  Button,
  Badge,
  Breadcrumb,
  PageWrapper,
  ModuleHeader,
  Stack,
  Card,
  StatCard,
} from "@repo/multiverse-ui";

import {
  useDailySummaryQuery,
  useMonthlyDtrQuery,
  useLateUndertimeQuery,
} from "./_hooks";
import { useEmployeeListQuery } from "../employees/_hooks";

// ─── CSV Export Utility ───────────────────────────────────────────────────────

function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (value: string | null) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

// ─── Reports Index ────────────────────────────────────────────────────────────

const ReportsIndex = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <Stack gap={24}>
        <ModuleHeader
          title="Reports"
          subtitle="View attendance and employee reports"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="min-w-none">
            <button
              type="button"
              className="flex w-full flex-col gap-3 p-2 text-left hover:opacity-80 transition-opacity"
              onClick={() => navigate("/reports/daily")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                  <LuChartBar size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Daily Attendance Summary
                  </p>
                  <p className="text-xs text-subtle">
                    View attendance for a specific date
                  </p>
                </div>
              </div>
            </button>
          </Card>

          <Card className="min-w-none">
            <button
              type="button"
              className="flex w-full flex-col gap-3 p-2 text-left hover:opacity-80 transition-opacity"
              onClick={() => navigate("/reports/monthly")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-subtle text-success">
                  <LuCalendarDays size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Monthly DTR</p>
                  <p className="text-xs text-subtle">
                    Daily Time Record per employee per month
                  </p>
                </div>
              </div>
            </button>
          </Card>

          <Card className="min-w-none">
            <button
              type="button"
              className="flex w-full flex-col gap-3 p-2 text-left hover:opacity-80 transition-opacity"
              onClick={() => navigate("/reports/late-undertime")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-subtle text-warning">
                  <LuClock size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Late / Undertime Report
                  </p>
                  <p className="text-xs text-subtle">
                    Track late and undertime occurrences
                  </p>
                </div>
              </div>
            </button>
          </Card>
        </div>
      </Stack>
    </PageWrapper>
  );
};

// ─── Daily Summary ────────────────────────────────────────────────────────────

const STATUS_BADGE_INTENT = {
  present: "success",
  absent: "default",
  late: "warning",
} as const;

type StatusKey = keyof typeof STATUS_BADGE_INTENT;

const DailySummary = () => {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const { data, isLoading } = useDailySummaryQuery(date);

  const handleExport = () => {
    if (!data) return;
    exportCsv(
      `daily-summary-${date}.csv`,
      [
        "Employee Name",
        "Employee #",
        "Department",
        "Time In",
        "Time Out",
        "Status",
        "Late (mins)",
      ],
      data.map((row) => [
        `${row.employee.firstName} ${row.employee.lastName}`,
        row.employee.employeeNumber,
        row.employee.department?.name ?? "",
        row.timeIn ? formatTime(row.timeIn) : "",
        row.timeOut ? formatTime(row.timeOut) : "",
        row.status,
        String(row.lateMinutes),
      ]),
    );
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Daily Attendance Summary"
          subtitle="Attendance overview for a specific date"
          actionElements={[
            <Button
              leadingIcon={LuPrinter}
              intent="default"
              onClick={() => window.print()}
            >
              Print
            </Button>,
            <Button
              leadingIcon={LuDownload}
              intent="primary"
              onClick={handleExport}
              disabled={!data || data.length === 0}
            >
              Export CSV
            </Button>,
          ]}
        />

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">Date</label>
            <input
              type="date"
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <Stack className="grow h-0">
          <Table data={data ?? []} isLoading={isLoading}>
            {({ Column }) => (
              <>
                <Column
                  label="Employee Name"
                  name="employee"
                  render={(row) =>
                    `${row.employee.firstName} ${row.employee.lastName}`
                  }
                />
                <Column
                  label="Employee #"
                  name="employee.employeeNumber"
                  render={(row) => row.employee.employeeNumber}
                />
                <Column
                  label="Department"
                  name="employee.department.name"
                  render={(row) => row.employee.department?.name ?? "-"}
                />
                <Column
                  label="Time In"
                  name="timeIn"
                  render={(row) => formatTime(row.timeIn)}
                />
                <Column
                  label="Time Out"
                  name="timeOut"
                  render={(row) => formatTime(row.timeOut)}
                />
                <Column
                  label="Status"
                  name="status"
                  render={(row) => {
                    const intent =
                      STATUS_BADGE_INTENT[row.status as StatusKey] ?? "default";
                    return (
                      <Badge
                        label={
                          row.status.charAt(0).toUpperCase() +
                          row.status.slice(1)
                        }
                        intent={intent}
                      />
                    );
                  }}
                />
                <Column
                  label="Late (mins)"
                  name="lateMinutes"
                  render={(row) =>
                    row.lateMinutes > 0 ? (
                      <Badge
                        label={`${row.lateMinutes} min`}
                        intent="warning"
                      />
                    ) : (
                      <span className="text-subtle text-xs">—</span>
                    )
                  }
                />
              </>
            )}
          </Table>
        </Stack>
      </Stack>
    </PageWrapper>
  );
};

// ─── Monthly DTR ──────────────────────────────────────────────────────────────

const MonthlyDtr = () => {
  const currentDate = new Date();
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { data: employeesData } = useEmployeeListQuery({ limit: 500 });
  const { data, isLoading } = useMonthlyDtrQuery({
    employeeId,
    year,
    month,
  });

  const employeeOptions =
    employeesData?.list.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    })) ?? [];

  const handleExport = () => {
    if (!data) return;
    const rows = data.rows.map((row) => [
      formatDate(row.date),
      row.dayOfWeek,
      row.timeIn ? formatTime(row.timeIn) : "",
      row.timeOut ? formatTime(row.timeOut) : "",
      row.hoursWorked != null ? row.hoursWorked.toFixed(2) : "",
      String(row.lateMinutes),
      String(row.undertimeMinutes),
    ]);
    rows.push([
      "TOTALS",
      "",
      "",
      "",
      data.totals.hoursWorked.toFixed(2),
      String(data.totals.lateMinutes),
      String(data.totals.undertimeMinutes),
    ]);
    exportCsv(
      `monthly-dtr-${data.employee.employeeNumber}-${year}-${String(month).padStart(2, "0")}.csv`,
      [
        "Date",
        "Day",
        "Time In",
        "Time Out",
        "Hours Worked",
        "Late (mins)",
        "Undertime (mins)",
      ],
      rows,
    );
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Monthly DTR"
          subtitle="Daily Time Record per employee"
          actionElements={[
            <Button
              leadingIcon={LuPrinter}
              intent="default"
              onClick={() => window.print()}
            >
              Print
            </Button>,
            <Button
              leadingIcon={LuDownload}
              intent="primary"
              onClick={handleExport}
              disabled={!data}
            >
              Export CSV
            </Button>,
          ]}
        />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">Employee</label>
            <select
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm min-w-64"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select employee...</option>
              {employeeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">Month</label>
            <select
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">Year</label>
            <input
              type="number"
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm w-28"
              value={year}
              min={2020}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        {data && (
          <div className="text-sm text-subtle">
            <span className="font-medium">
              {data.employee.firstName} {data.employee.lastName}
            </span>{" "}
            — {data.employee.department?.name ?? "No Department"} —{" "}
            {data.employee.employeeNumber}
          </div>
        )}

        <Stack className="grow h-0">
          <Table
            data={data?.rows ?? []}
            isLoading={isLoading && Boolean(employeeId)}
          >
            {({ Column }) => (
              <>
                <Column
                  label="Date"
                  name="date"
                  render={(row) => formatDate(row.date)}
                />
                <Column label="Day" name="dayOfWeek" />
                <Column
                  label="Time In"
                  name="timeIn"
                  render={(row) => formatTime(row.timeIn)}
                />
                <Column
                  label="Time Out"
                  name="timeOut"
                  render={(row) => formatTime(row.timeOut)}
                />
                <Column
                  label="Hours Worked"
                  name="hoursWorked"
                  render={(row) =>
                    row.hoursWorked != null
                      ? `${row.hoursWorked.toFixed(2)}h`
                      : "-"
                  }
                />
                <Column
                  label="Late (mins)"
                  name="lateMinutes"
                  render={(row) =>
                    row.lateMinutes > 0 ? String(row.lateMinutes) : "—"
                  }
                />
                <Column
                  label="Undertime (mins)"
                  name="undertimeMinutes"
                  render={(row) =>
                    row.undertimeMinutes > 0
                      ? String(row.undertimeMinutes)
                      : "—"
                  }
                />
              </>
            )}
          </Table>
        </Stack>

        {data && (
          <div className="flex gap-6 rounded-lg border border-subtle bg-interface-subtle px-4 py-3 text-sm">
            <span className="font-semibold">Totals:</span>
            <span>
              Hours Worked:{" "}
              <strong>{data.totals.hoursWorked.toFixed(2)}h</strong>
            </span>
            <span>
              Late: <strong>{data.totals.lateMinutes} min</strong>
            </span>
            <span>
              Undertime: <strong>{data.totals.undertimeMinutes} min</strong>
            </span>
          </div>
        )}
      </Stack>
    </PageWrapper>
  );
};

// ─── Late / Undertime Report ──────────────────────────────────────────────────

type SortField = "lateMinutes" | "undertimeMinutes";
type SortDir = "asc" | "desc";

const LateUndertime = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("lateMinutes");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = useLateUndertimeQuery({ from, to });

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    if (!sortedData.length) return;
    exportCsv(
      `late-undertime-${from || "all"}-to-${to || "all"}.csv`,
      [
        "Employee Name",
        "Employee #",
        "Department",
        "Date",
        "Late (mins)",
        "Undertime (mins)",
      ],
      sortedData.map((row) => [
        `${row.employee.firstName} ${row.employee.lastName}`,
        row.employee.employeeNumber,
        row.employee.department?.name ?? "",
        formatDate(row.date),
        String(row.lateMinutes),
        String(row.undertimeMinutes),
      ]),
    );
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Late / Undertime Report"
          subtitle="Track late arrivals and early departures"
          actionElements={[
            <Button
              leadingIcon={LuPrinter}
              intent="default"
              onClick={() => window.print()}
            >
              Print
            </Button>,
            <Button
              leadingIcon={LuDownload}
              intent="primary"
              onClick={handleExport}
              disabled={sortedData.length === 0}
            >
              Export CSV
            </Button>,
          ]}
        />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">From</label>
            <input
              type="date"
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-subtle">To</label>
            <input
              type="date"
              className="rounded border border-subtle bg-surface px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {(from || to) && (
            <Button
              variant="text"
              intent="primary"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-subtle">Sort by:</span>
          <Button
            variant={sortField === "lateMinutes" ? "solid" : "ghost"}
            intent={sortField === "lateMinutes" ? "primary" : "default"}
            onClick={() => toggleSort("lateMinutes")}
          >
            Late{sortIndicator("lateMinutes")}
          </Button>
          <Button
            variant={sortField === "undertimeMinutes" ? "solid" : "ghost"}
            intent={sortField === "undertimeMinutes" ? "primary" : "default"}
            onClick={() => toggleSort("undertimeMinutes")}
          >
            Undertime{sortIndicator("undertimeMinutes")}
          </Button>
        </div>

        <Stack className="grow h-0">
          <Table data={sortedData} isLoading={isLoading}>
            {({ Column }) => (
              <>
                <Column
                  label="Employee Name"
                  name="employee"
                  render={(row) =>
                    `${row.employee.firstName} ${row.employee.lastName}`
                  }
                />
                <Column
                  label="Employee #"
                  name="employee.employeeNumber"
                  render={(row) => row.employee.employeeNumber}
                />
                <Column
                  label="Department"
                  name="employee.department.name"
                  render={(row) => row.employee.department?.name ?? "-"}
                />
                <Column
                  label="Date"
                  name="date"
                  render={(row) => formatDate(row.date)}
                />
                <Column
                  label="Late (mins)"
                  name="lateMinutes"
                  render={(row) =>
                    row.lateMinutes > 0 ? (
                      <Badge
                        label={`${row.lateMinutes} min`}
                        intent="warning"
                      />
                    ) : (
                      <span className="text-subtle text-xs">—</span>
                    )
                  }
                />
                <Column
                  label="Undertime (mins)"
                  name="undertimeMinutes"
                  render={(row) =>
                    row.undertimeMinutes > 0 ? (
                      <Badge
                        label={`${row.undertimeMinutes} min`}
                        intent="info"
                      />
                    ) : (
                      <span className="text-subtle text-xs">—</span>
                    )
                  }
                />
              </>
            )}
          </Table>
        </Stack>
      </Stack>
    </PageWrapper>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Reports = () => {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumb label="Reports" action={() => navigate("/reports")} />
      <Routes>
        <Route index element={<ReportsIndex />} />
        <Route path="/daily" element={<DailySummary />} />
        <Route path="/monthly" element={<MonthlyDtr />} />
        <Route path="/late-undertime" element={<LateUndertime />} />
        <Route path="*" element={<Navigate to="/reports" />} />
      </Routes>
    </>
  );
};

export default Reports;
