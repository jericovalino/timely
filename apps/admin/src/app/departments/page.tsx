import { useCallback, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { LuPlus, LuPencil, LuTrash2, LuCheck, LuX } from "react-icons/lu";
import { toast } from "react-toastify";

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
  useDepartmentListQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "./_hooks";
import { createDepartmentSchema, updateDepartmentSchema } from "./schemas";
import type { Department } from "./schemas";

const { forwardFormContext: forwardCreate, TextInput: CreateTextInput } =
  createForm({ zodSchema: createDepartmentSchema });

const { forwardFormContext: forwardUpdate, TextInput: UpdateTextInput } =
  createForm({ zodSchema: updateDepartmentSchema });

type CreateDepartmentModalProps = {
  close: () => void;
  state: unknown;
};

const CreateDepartmentForm = forwardCreate((_, ctx) => {
  const createMutation = useCreateDepartmentMutation();

  return (
    <form
      className="flex flex-col"
      onSubmit={ctx.handleSubmit((values) => {
        createMutation.mutate(values, {
          onSuccess: () => {
            ctx.reset();
          },
        });
      })}
    >
      <CreateTextInput
        name="name"
        label="Department Name"
        placeholder="e.g. Engineering"
      />
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          intent="primary"
          loading={createMutation.isPending}
        >
          Create
        </Button>
      </div>
    </form>
  );
});

const CreateDepartmentModal = ({ close }: CreateDepartmentModalProps) => (
  <Modal onClose={close} title="Add Department">
    <CreateDepartmentForm />
  </Modal>
);

type EditRowProps = {
  department: Department;
  onDone: () => void;
};

const EditRow = forwardUpdate(({ department, onDone }: EditRowProps, ctx) => {
  const updateMutation = useUpdateDepartmentMutation();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={ctx.handleSubmit((values) => {
        updateMutation.mutate(
          { id: department.id, ...values },
          {
            onSuccess: () => {
              onDone();
            },
          },
        );
      })}
    >
      <UpdateTextInput
        name="name"
        label=""
        placeholder="Department name"
        inline
      />
      <Button
        type="submit"
        variant="icon"
        icon={LuCheck}
        intent="success"
        loading={updateMutation.isPending}
      />
      <Button
        type="button"
        variant="icon"
        icon={LuX}
        intent="default"
        onClick={onDone}
      />
    </form>
  );
});

const DepartmentList = () => {
  const { data, isLoading } = useDepartmentListQuery();
  const deleteMutation = useDeleteDepartmentMutation();
  const [editingId, setEditingId] = useState<string | null>(null);

  const createOverlay = useCreateOverlay({});

  const openCreateModal = useCallback(() => {
    createOverlay({
      component: ({ close, state }) => (
        <CreateDepartmentModal close={close} state={state} />
      ),
    });
  }, [createOverlay]);

  const handleDelete = (dept: Department) => {
    if (
      window.confirm(
        `Delete department "${dept.name}"? This will fail if employees are assigned.`,
      )
    ) {
      deleteMutation.mutate(dept.id, {
        onError: () => {
          toast.error(
            "Cannot delete department. Employees are still assigned to it.",
          );
        },
      });
    }
  };

  return (
    <PageWrapper>
      <Stack gap={24} className="h-full">
        <ModuleHeader
          title="Departments"
          subtitle="Manage company departments"
          actionElements={[
            <Button
              leadingIcon={LuPlus}
              intent="primary"
              onClick={openCreateModal}
            >
              Add Department
            </Button>,
          ]}
        />
        <Table data={data?.list ?? []} isLoading={isLoading}>
          {({ Column }) => (
            <>
              <Column
                label="Name"
                name="name"
                render={(row) =>
                  editingId === row.id ? (
                    <EditRow
                      department={row}
                      onDone={() => setEditingId(null)}
                      defaultGeekValues={{ name: row.name }}
                    />
                  ) : (
                    <span>{row.name}</span>
                  )
                }
              />
              <Column
                label="Actions"
                name="id"
                render={(row) =>
                  editingId === row.id ? null : (
                    <div className="flex gap-2">
                      <Button
                        variant="icon"
                        icon={LuPencil}
                        onClick={() => setEditingId(row.id)}
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
                  )
                }
              />
            </>
          )}
        </Table>
      </Stack>
    </PageWrapper>
  );
};

const Departments = () => {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumb label="Departments" action={() => navigate("/departments")} />
      <Routes>
        <Route index element={<DepartmentList />} />
        <Route path="*" element={<Navigate to="/departments" />} />
      </Routes>
    </>
  );
};

export default Departments;
