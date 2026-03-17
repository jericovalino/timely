import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { UpdateDepartmentPayload } from "../schemas";
import { invalidateDepartmentListQuery } from "./useDepartmentListQuery";

const useUpdateDepartmentMutation = () =>
  useMutation({
    mutationKey: ["UPDATE_DEPARTMENT"],
    mutationFn: ({ id, ...payload }: UpdateDepartmentPayload & { id: string }) =>
      api.patch(`/departments/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      invalidateDepartmentListQuery();
    },
  });

export default useUpdateDepartmentMutation;
