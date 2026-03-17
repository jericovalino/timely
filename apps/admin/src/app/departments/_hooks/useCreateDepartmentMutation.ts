import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { CreateDepartmentPayload } from "../schemas";
import { invalidateDepartmentListQuery } from "./useDepartmentListQuery";

const useCreateDepartmentMutation = () =>
  useMutation({
    mutationKey: ["CREATE_DEPARTMENT"],
    mutationFn: (payload: CreateDepartmentPayload) =>
      api.post("/departments", payload).then((r) => r.data),
    onSuccess: () => {
      invalidateDepartmentListQuery();
    },
  });

export default useCreateDepartmentMutation;
