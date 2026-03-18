import { useCallback, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { LuPlus, LuPencil, LuTrash2 } from "react-icons/lu";

import {
  Table,
  Button,
  PageWrapper,
  ModuleHeader,
  Stack,
  Modal,
  Breadcrumb,
  useCreateOverlay,
} from "@repo/multiverse-ui";
import { createForm } from "@repo/utilities";

import {
  useScheduleListQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
} from "./_hooks";
import { createScheduleSchema, workDays } from "./schemas";
import type { Schedule, CreateSchedulePayload } from "./schemas";

const DAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const { forwardFormContext, TextInput, TimeInput } = createForm({
  zodSchema: createScheduleSchema,
});

type ScheduleFormInnerProps = {
  initialValues?: Partial<CreateSchedulePayload>;
  onSubmit: (values: CreateSchedulePayload) => void;
  isPending: boolean;
  onCancel: () => void;
  submitLabel?: string;
};

const ScheduleFormContent = forwardFormContext(
  (
    {
      initialValues: _initialValues,
      onSubmit,
      isPending,
      onCancel,
      submitLabel = "Save",
    }: ScheduleFormInnerProps,
    ctx,
  ) => {
    const [selectedDays, setSelectedDays] = useState<string[]>(
      _initialValues?.workDays ?? [],
    );

    const toggleDay = (day: string) => {
      const next = selectedDays.includes(day)
        ? selectedDays.filter((d) => d !== day)
        : [...selectedDays, day];
      setSelectedDays(next);
      ctx.setValue("workDays", next as (typeof workDays)[number][]);
    };

    return (
      <form
        className="flex flex-col"
        onSubmit={ctx.handleSubmit(onSubmit)}
      >
        <TextInput
          name="name"
          label="Schedule Name"
          placeholder="e.g. Standard 8-5"
        />
        <div className="grid grid-cols-2 gap-4">
          <TimeInput name="startTime" label="Start Time" />
          <TimeInput name="endTime" label="End Time" />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Work Days</p>
          <div className="flex flex-wrap gap-2">
            {workDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  selectedDays.includes(day)
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {DAY_LABELS[day] ?? day}
              </button>
            ))}
          </div>
          {ctx.formState.errors.workDays && (
            <p className="mt-1 text-xs text-red-500">
              {ctx.formState.errors.workDays.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" intent="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" intent="primary" loading={isPending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    );
  },
);

type CreateScheduleModalProps = {
  close: () => void;
  state: unknown;
};

const CreateScheduleModal = ({ close }: CreateScheduleModalProps) => {
  const createMutation = useCreateScheduleMutation();
  return (
    <Modal onClose={close} title="Add Work Schedule">
      <ScheduleFormContent
        onSubmit={(values) => {
          createMutation.mutate(values, {
            onSuccess: close,
          });
        }}
        isPending={createMutation.isPending}
        onCancel={close}
        submitLabel="Create"
      />
    </Modal>
  );
};

type EditScheduleModalProps = {
  schedule: Schedule;
  close: () => void;
  state: unknown;
};

const EditScheduleModal = ({ schedule, close }: EditScheduleModalProps) => {
  const updateMutation = useUpdateScheduleMutation();
  return (
    <Modal onClose={close} title="Edit Work Schedule">
      <ScheduleFormContent
        initialValues={{
          name: schedule.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          workDays: schedule.workDays as (typeof workDays)[number][],
        }}
        defaultGeekValues={{
          name: schedule.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          workDays: schedule.workDays as (typeof workDays)[number][],
        }}
        onSubmit={(values) => {
          updateMutation.mutate(
            { id: schedule.id, ...values },
            { onSuccess: close },
          );
        }}
        isPending={updateMutation.isPending}
        onCancel={close}
        submitLabel="Save Changes"
      />
    </Modal>
  );
};

const ScheduleList = () => {
  const { data, isLoading } = useScheduleListQuery();
  const deleteMutation = useDeleteScheduleMutation();

  const createOverlay = useCreateOverlay({});

  const openCreateModal = useCallback(() => {
    createOverlay({
      component: ({ close, state }) => (
        <CreateScheduleModal close={close} state={state} />
      ),
    });
  }, [createOverlay]);

  const openEditModal = useCallback(
    (schedule: Schedule) => {
      createOverlay({
        component: ({ close, state }) => (
          <EditScheduleModal schedule={schedule} close={close} state={state} />
        ),
      });
    },
    [createOverlay],
  );

  const handleDelete = (schedule: Schedule) => {
    if (window.confirm(`Delete schedule "${schedule.name}"?`)) {
      deleteMutation.mutate(schedule.id);
    }
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Work Schedules"
          subtitle="Manage employee work schedules"
          actionElements={[
            <Button
              leadingIcon={LuPlus}
              intent="primary"
              onClick={openCreateModal}
            >
              Add Schedule
            </Button>,
          ]}
        />
        <Table data={data?.list ?? []} isLoading={isLoading}>
          {({ Column }) => (
            <>
              <Column label="Name" name="name" />
              <Column label="Start Time" name="startTime" />
              <Column label="End Time" name="endTime" />
              <Column
                label="Work Days"
                name="workDays"
                render={(row) =>
                  Array.isArray(row.workDays)
                    ? row.workDays.map((d) => DAY_LABELS[d] ?? d).join(", ")
                    : "-"
                }
              />
              <Column
                label="Actions"
                name="id"
                render={(row) => (
                  <div className="flex gap-2">
                    <Button
                      variant="icon"
                      icon={LuPencil}
                      onClick={() => openEditModal(row)}
                    />
                    <Button
                      variant="icon"
                      icon={LuTrash2}
                      intent="danger"
                      loading={
                        deleteMutation.isPending &&
                        deleteMutation.variables === row.id
                      }
                      onClick={() => handleDelete(row)}
                    />
                  </div>
                )}
              />
            </>
          )}
        </Table>
      </Stack>
    </PageWrapper>
  );
};

const Schedules = () => {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumb label="Schedules" action={() => navigate("/schedules")} />
      <Routes>
        <Route index element={<ScheduleList />} />
        <Route path="*" element={<Navigate to="/schedules" />} />
      </Routes>
    </>
  );
};

export default Schedules;
