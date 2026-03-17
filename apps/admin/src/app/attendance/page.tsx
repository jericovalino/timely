import { useState, useMemo } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { z } from "zod";
import { LuPencil, LuClipboardList } from "react-icons/lu";

import {
  Table,
  Button,
  Badge,
  Pagination,
  Breadcrumb,
  PageWrapper,
  ModuleHeader,
  ModuleFilters,
  Stack,
  Modal,
  useCreateOverlay,
} from "@repo/multiverse-ui";
import { createForm } from "@repo/utilities";

import {
  useAttendanceListQuery,
  useUpdateAttendanceMutation,
  useAttendanceLogListQuery,
} from "./_hooks";
import type { AttendanceRecord } from "./_hooks";
import { useDepartmentListQuery } from "../departments/_hooks";

// ─── Edit Attendance Form ────────────────────────────────────────────────────

const editAttendanceSchema = z.object({
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  adminNote: z.string().optional(),
});

const {
  forwardFormContext: forwardEditForm,
  TextInput: EditTextInput,
  TextArea: EditTextArea,
} = createForm({ zodSchema: editAttendanceSchema });

type EditAttendanceFormProps = {
  record: AttendanceRecord;
  close: () => void;
};

const EditAttendanceForm = forwardEditForm(
  ({ record, close }: EditAttendanceFormProps, ctx) => {
    const updateMutation = useUpdateAttendanceMutation();

    return (
      <form
        className="flex flex-col"
        onSubmit={ctx.handleSubmit((values) => {
          updateMutation.mutate(
            { id: record.id, ...values },
            { onSuccess: close },
          );
        })}
      >
        <EditTextInput name="timeIn" label="Time In" placeholder="HH:MM" />
        <EditTextInput name="timeOut" label="Time Out" placeholder="HH:MM" />
        <EditTextArea
          name="adminNote"
          label="Admin Note"
          placeholder="Optional note..."
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            intent="primary"
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    );
  },
);

type EditAttendanceModalProps = {
  record: AttendanceRecord;
  close: () => void;
};

const EditAttendanceModal = ({ record, close }: EditAttendanceModalProps) => (
  <Modal onClose={close} title="Edit Attendance Record">
    <EditAttendanceForm
      record={record}
      close={close}
      defaultGeekValues={{
        timeIn: record.timeIn ?? "",
        timeOut: record.timeOut ?? "",
        adminNote: record.adminNote ?? "",
      }}
    />
  </Modal>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Attendance List ──────────────────────────────────────────────────────────

const AttendanceList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Record<string, unknown>>({});
  const { data: deptData } = useDepartmentListQuery();

  const queryFilter = useMemo(() => {
    const f = { ...filter };
    if (f.isLate === "true") f.isLate = true;
    else delete f.isLate;
    if (f.isUndertime === "true") f.isUndertime = true;
    else delete f.isUndertime;
    return f;
  }, [filter]);

  const { data, isLoading } = useAttendanceListQuery(queryFilter);

  const createOverlay = useCreateOverlay({});

  const handleEdit = (record: AttendanceRecord) => {
    createOverlay({
      component: ({ close }) => (
        <EditAttendanceModal record={record} close={close} />
      ),
    });
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Attendance Records"
          subtitle="View and manage employee attendance"
          actionElements={[
            <Button
              leadingIcon={LuClipboardList}
              intent="default"
              onClick={() => navigate("/attendance/logs")}
            >
              View Audit Log
            </Button>,
          ]}
        />
        <ModuleFilters
          filter={filter}
          setFilter={setFilter}
          searchPlaceholder="Search employee..."
          renderFormat={({ SelectInput, DatePicker }) => [
            {
              key: "from",
              element: <DatePicker name="from" label="From" />,
              activeLabel: "From",
              renderActiveValue: (value) => formatDate(value),
            },
            {
              key: "to",
              element: <DatePicker name="to" label="To" />,
              activeLabel: "To",
              renderActiveValue: (value) => formatDate(value),
            },
            {
              key: "departmentId",
              element: (
                <SelectInput
                  name="departmentId"
                  label="Department"
                  options={
                    deptData?.list.map((d) => ({
                      label: d.name,
                      value: d.id,
                    })) ?? []
                  }
                />
              ),
              activeLabel: "Department",
              renderActiveValue: (value) =>
                deptData?.list.find((d) => d.id === value)?.name ?? value,
            },
            {
              key: "isLate",
              element: (
                <SelectInput
                  name="isLate"
                  label="Late"
                  options={[{ label: "Yes", value: "true" }]}
                />
              ),
              activeLabel: "Late",
              renderActiveValue: () => "Yes",
            },
            {
              key: "isUndertime",
              element: (
                <SelectInput
                  name="isUndertime"
                  label="Undertime"
                  options={[{ label: "Yes", value: "true" }]}
                />
              ),
              activeLabel: "Undertime",
              renderActiveValue: () => "Yes",
            },
          ]}
        />

        <Stack className="grow h-0">
          <Table data={data?.list ?? []} isLoading={isLoading}>
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
                  name="employeeId"
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
                  name="totalHoursWorked"
                  render={(row) =>
                    row.totalHoursWorked != null
                      ? `${row.totalHoursWorked.toFixed(2)}h`
                      : "-"
                  }
                />
                <Column
                  label="Late"
                  name="isLate"
                  render={(row) =>
                    row.isLate ? (
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
                  label="Undertime"
                  name="isUndertime"
                  render={(row) =>
                    row.isUndertime ? (
                      <Badge
                        label={`${row.undertimeMinutes} min`}
                        intent="warning"
                      />
                    ) : (
                      <span className="text-subtle text-xs">—</span>
                    )
                  }
                />
                <Column
                  label="Actions"
                  name="id"
                  render={(row) => (
                    <Button
                      variant="icon"
                      icon={LuPencil}
                      onClick={() => handleEdit(row)}
                    />
                  )}
                />
              </>
            )}
          </Table>
        </Stack>

        <Pagination
          data={
            data?.meta
              ? {
                  current_page: data.meta.page,
                  last_page: Math.ceil(data.meta.total / data.meta.perPage),
                  total: data.meta.total,
                  from: (data.meta.page - 1) * data.meta.perPage + 1,
                  to: Math.min(
                    data.meta.page * data.meta.perPage,
                    data.meta.total,
                  ),
                }
              : undefined
          }
          onChange={(page) => setFilter((prev) => ({ ...prev, page }))}
        />
      </Stack>
    </PageWrapper>
  );
};

// ─── Attendance Logs ──────────────────────────────────────────────────────────

const LOG_BADGE_INTENT = {
  IN: "success",
  OUT: "info",
  IGNORED: "warning",
} as const;

const AttendanceLogs = () => {
  const [filter, setFilter] = useState<{ page?: number }>({});
  const { data, isLoading } = useAttendanceLogListQuery(filter);

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Attendance Audit Log"
          subtitle="Raw scan records from biometric devices"
        />

        <Stack className="grow h-0">
          <Table data={data?.list ?? []} isLoading={isLoading}>
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
                  name="employeeId"
                  render={(row) => row.employee.employeeNumber}
                />
                <Column
                  label="Date"
                  name="date"
                  render={(row) => formatDate(row.date)}
                />
                <Column
                  label="Scanned At"
                  name="scannedAt"
                  render={(row) => formatTime(row.scannedAt)}
                />
                <Column
                  label="Type"
                  name="type"
                  render={(row) => (
                    <Badge
                      label={row.type}
                      intent={LOG_BADGE_INTENT[row.type]}
                    />
                  )}
                />
              </>
            )}
          </Table>
        </Stack>

        <Pagination
          data={
            data?.meta
              ? {
                  current_page: data.meta.page,
                  last_page: Math.ceil(data.meta.total / data.meta.perPage),
                  total: data.meta.total,
                  from: (data.meta.page - 1) * data.meta.perPage + 1,
                  to: Math.min(
                    data.meta.page * data.meta.perPage,
                    data.meta.total,
                  ),
                }
              : undefined
          }
          onChange={(page) => setFilter((prev) => ({ ...prev, page }))}
        />
      </Stack>
    </PageWrapper>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Attendance = () => {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumb label="Attendance" action={() => navigate("/attendance")} />
      <Routes>
        <Route index element={<AttendanceList />} />
        <Route path="/logs" element={<AttendanceLogs />} />
        <Route path="*" element={<Navigate to="/attendance" />} />
      </Routes>
    </>
  );
};

export default Attendance;
