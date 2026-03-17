import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { UpdateEmployeePayload } from "../schemas";
import { invalidateEmployeeListQuery } from "./useEmployeeListQuery";
import { queryClient } from "@repo/app-providers";

const useUpdateEmployeeMutation = (id: string) =>
  useMutation({
    mutationKey: ["UPDATE_EMPLOYEE", id],
    mutationFn: (payload: UpdateEmployeePayload) =>
      api.patch(`/employees/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      invalidateEmployeeListQuery();
      queryClient.invalidateQueries({ queryKey: ["EMPLOYEES", id] });
    },
  });

export default useUpdateEmployeeMutation;
