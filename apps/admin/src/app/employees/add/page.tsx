import { useNavigate } from "react-router";
import { createForm } from "@repo/utilities";
import { Button, PageWrapper, ModuleHeader, Stack, Card } from "@repo/multiverse-ui";
import { createEmployeeSchema } from "../schemas";
import { useCreateEmployeeMutation } from "../_hooks";
import { useDepartmentListQuery } from "../../departments/_hooks";
import { useScheduleListQuery } from "../../schedules/_hooks";

const { forwardFormContext, TextInput, SelectInput } = createForm({
  zodSchema: createEmployeeSchema,
});

const AddEmployee = forwardFormContext((_, ctx) => {
  const navigate = useNavigate();
  const createMutation = useCreateEmployeeMutation();
  const { data: deptData } = useDepartmentListQuery();
  const { data: schedData } = useScheduleListQuery();

  const departmentOptions =
    deptData?.list.map((d) => ({ label: d.name, value: d.id })) ?? [];

  const scheduleOptions =
    schedData?.list.map((s) => ({ label: s.name, value: s.id })) ?? [];

  return (
    <PageWrapper>
      <Stack gap={24}>
        <ModuleHeader
          title="Add Employee"
          subtitle="Create a new employee record"
        />
        <Card className="max-w-none">
          <form
            className="flex flex-col p-6"
            onSubmit={ctx.handleSubmit((values) => {
              createMutation.mutate(values, {
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
                loading={createMutation.isPending}
              >
                Create Employee
              </Button>
            </div>
          </form>
        </Card>
      </Stack>
    </PageWrapper>
  );
});

export default AddEmployee;
