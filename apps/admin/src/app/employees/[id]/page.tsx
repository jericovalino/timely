import { useParams, useNavigate } from "react-router";
import { createForm } from "@repo/utilities";
import {
  Button,
  PageWrapper,
  ModuleHeader,
  Stack,
  Card,
  Badge,
  RecordItem,
} from "@repo/multiverse-ui";
import { updateEmployeeSchema } from "../schemas";
import { useEmployeeDetailQuery, useUpdateEmployeeMutation } from "../_hooks";
import { useDepartmentListQuery } from "../../departments/_hooks";
import { useScheduleListQuery } from "../../schedules/_hooks";
import type { Employee } from "../schemas";

const { forwardFormContext, TextInput, SelectInput } = createForm({
  zodSchema: updateEmployeeSchema,
});

type EmployeeEditFormProps = {
  employee: Employee;
};

const EmployeeEditForm = forwardFormContext(
  ({ employee }: EmployeeEditFormProps, ctx) => {
    const navigate = useNavigate();
    const updateMutation = useUpdateEmployeeMutation(employee.id);
    const { data: deptData } = useDepartmentListQuery();
    const { data: schedData } = useScheduleListQuery();

    const departmentOptions =
      deptData?.list.map((d) => ({ label: d.name, value: d.id })) ?? [];

    const scheduleOptions =
      schedData?.list.map((s) => ({ label: s.name, value: s.id })) ?? [];

    return (
      <PageWrapper className="h-auto min-h-full">
        <Stack gap={24}>
          <ModuleHeader
            title={`${employee.firstName} ${employee.lastName}`}
            subtitle={`Employee #${employee.employeeNumber}`}
            actionElements={[
              <Badge
                label={employee.isActive ? "Active" : "Inactive"}
                intent={employee.isActive ? "success" : "danger"}
              />,
            ]}
          />
          <Card className="max-w-none">
            <div className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <RecordItem
                  name="Employee Number"
                  description={employee.employeeNumber}
                />
                <RecordItem
                  name="Position"
                  description={employee.position ?? "-"}
                />
                <RecordItem name="Email" description={employee.email ?? "-"} />
                <RecordItem name="Phone" description={employee.phone ?? "-"} />
                <RecordItem
                  name="Department"
                  description={employee.department?.name ?? "-"}
                />
                <RecordItem
                  name="Schedule"
                  description={employee.schedule?.name ?? "-"}
                />
              </div>
              <hr className="my-6" />
              <h3 className="mb-4 text-base font-semibold text-gray-800">
                Edit Employee
              </h3>
              <form
                className="flex flex-col"
                onSubmit={ctx.handleSubmit((values) => {
                  updateMutation.mutate(values, {
                    onSuccess: () => {
                      navigate("/employees");
                    },
                  });
                })}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    name="employeeNumber"
                    label="Employee Number"
                    placeholder="e.g. EMP-001"
                  />
                  <TextInput
                    name="position"
                    label="Position"
                    placeholder="e.g. Software Engineer"
                  />
                  <TextInput
                    name="firstName"
                    label="First Name"
                    placeholder="Enter first name"
                  />
                  <TextInput
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter last name"
                  />
                  <TextInput
                    name="email"
                    label="Email"
                    placeholder="Enter email address"
                  />
                  <TextInput
                    name="phone"
                    label="Phone"
                    placeholder="Enter phone number"
                  />
                  <SelectInput
                    name="departmentId"
                    label="Department"
                    placeholder="Select department"
                    options={departmentOptions}
                  />
                  <SelectInput
                    name="scheduleId"
                    label="Work Schedule"
                    placeholder="Select schedule"
                    options={scheduleOptions}
                  />
                  <TextInput
                    name="photoUrl"
                    label="Photo URL (optional)"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    intent="default"
                    onClick={() => navigate("/employees")}
                  >
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
            </div>
          </Card>
        </Stack>
      </PageWrapper>
    );
  },
);

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployeeDetailQuery(id ?? "");

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading employee details...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!employee) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-500">Employee not found.</p>
          <Button intent="primary" onClick={() => navigate("/employees")}>
            Back to Employees
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <EmployeeEditForm
      employee={employee}
      defaultGeekValues={{
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone ?? "",
        position: employee.position,
        departmentId: employee.departmentId,
        scheduleId: employee.scheduleId,
        photoUrl: employee.photoUrl ?? "",
      }}
    />
  );
};

export default EmployeeDetail;
