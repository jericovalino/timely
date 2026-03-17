import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import { invalidateDepartmentListQuery } from "./useDepartmentListQuery";

const useDeleteDepartmentMutation = () =>
  useMutation({
    mutationKey: ["DELETE_DEPARTMENT"],
    mutationFn: (id: string) =>
      api.delete(`/departments/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateDepartmentListQuery();
    },
  });

export default useDeleteDepartmentMutation;
