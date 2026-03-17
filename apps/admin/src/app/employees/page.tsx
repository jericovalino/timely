import { useCallback, useState, useMemo } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { LuUserPlus } from "react-icons/lu";
import { HiPencilAlt, HiOutlineBan } from "react-icons/hi";

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
  Dialog,
  useCreateOverlay,
} from "@repo/multiverse-ui";

import {
  useEmployeeListQuery,
  useDeactivateEmployeeMutation,
} from "./_hooks";
import { useDepartmentListQuery } from "../departments/_hooks";
import type { Employee } from "./schemas";
import AddEmployee from "./add/page";
import EmployeeDetail from "./[id]/page";

type DeactivateDialogProps = {
  employee: Employee;
  onConfirm: (id: string) => void;
  isPending: boolean;
  close: () => void;
};

const DeactivateDialog = ({
  employee,
  onConfirm,
  isPending,
  close,
}: DeactivateDialogProps) => (
  <Dialog
    intent="danger"
    title="Deactivate Employee"
    message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`}
    onClose={close}
    primaryAction={{
      label: "Deactivate",
      onClick: () => onConfirm(employee.id),
    }}
    secondaryAction={{
      label: "Cancel",
      onClick: close,
    }}
    isLoading={isPending}
  />
);

const EmployeeList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Record<string, unknown>>({});
  const { data: deptData } = useDepartmentListQuery();

  const queryFilter = useMemo(() => {
    const f = { ...filter };
    if (f.isActive === "true") f.isActive = true;
    else if (f.isActive === "false") f.isActive = false;
    else delete f.isActive;
    return f;
  }, [filter]);

  const { data, isLoading } = useEmployeeListQuery(queryFilter);
  const deactivateMutation = useDeactivateEmployeeMutation();

  const createOverlay = useCreateOverlay({ isPending: deactivateMutation.isPending });

  const handleDeactivate = useCallback(
    (employee: Employee) => {
      createOverlay({
        component: ({ close, state }) => (
          <DeactivateDialog
            employee={employee}
            isPending={state.isPending}
            close={close}
            onConfirm={(id) => {
              deactivateMutation.mutate(id, {
                onSuccess: close,
              });
            }}
          />
        ),
      });
    },
    [createOverlay, deactivateMutation]
  );

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Employees"
          subtitle="Manage your workforce"
          actionElements={[
            <Button
              leadingIcon={LuUserPlus}
              intent="primary"
              onClick={() => navigate("/employees/add")}
            >
              Add Employee
            </Button>,
          ]}
        />
        <ModuleFilters
          filter={filter}
          setFilter={setFilter}
          searchPlaceholder="Search by name or employee #"
          renderFormat={({ SelectInput }) => [
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
              key: "isActive",
              element: (
                <SelectInput
                  name="isActive"
                  label="Status"
                  options={[
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                />
              ),
              activeLabel: "Status",
              renderActiveValue: (value) =>
                value === "true" ? "Active" : "Inactive",
            },
          ]}
        />
        <Stack className="grow h-0">
          <Table data={data?.list ?? []} isLoading={isLoading}>
            {({ Column }) => (
              <>
                <Column label="Employee #" name="employeeNumber" />
                <Column
                  label="Name"
                  name="firstName"
                  render={(row) => `${row.firstName} ${row.lastName}`}
                />
                <Column
                  label="Department"
                  name="department"
                  render={(row) => row.department?.name ?? "-"}
                />
                <Column label="Position" name="position" />
                <Column
                  label="Status"
                  name="isActive"
                  render={(row) => (
                    <Badge
                      label={row.isActive ? "Active" : "Inactive"}
                      intent={row.isActive ? "success" : "danger"}
                    />
                  )}
                />
                <Column
                  label="Actions"
                  name="id"
                  render={(row) => (
                    <div className="flex gap-2">
                      <Button
                        variant="icon"
                        icon={HiPencilAlt}
                        onClick={() => navigate(`/employees/${row.id}`)}
                      />
                      {row.isActive && (
                        <Button
                          variant="icon"
                          icon={HiOutlineBan}
                          intent="danger"
                          onClick={() => handleDeactivate(row)}
                        />
                      )}
                    </div>
                  )}
                />
              </>
            )}
          </Table>
        </Stack>
        <Pagination
          data={data?.meta ? {
            current_page: data.meta.page,
            last_page: Math.ceil(data.meta.total / data.meta.perPage),
            total: data.meta.total,
            from: (data.meta.page - 1) * data.meta.perPage + 1,
            to: Math.min(data.meta.page * data.meta.perPage, data.meta.total),
          } : undefined}
          onChange={(page) => setFilter((prev) => ({ ...prev, page }))}
        />
      </Stack>
    </PageWrapper>
  );
};

const Employees = () => {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumb label="Employees" action={() => navigate("/employees")} />
      <Routes>
        <Route index element={<EmployeeList />} />
        <Route path="/add" element={<AddEmployee />} />
        <Route path="/:id" element={<EmployeeDetail />} />
        <Route path="*" element={<Navigate to="/employees" />} />
      </Routes>
    </>
  );
};

export default Employees;
