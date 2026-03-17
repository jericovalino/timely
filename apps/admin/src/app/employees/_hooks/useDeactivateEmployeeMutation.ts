import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import { invalidateEmployeeListQuery } from "./useEmployeeListQuery";

const useDeactivateEmployeeMutation = () =>
  useMutation({
    mutationKey: ["DEACTIVATE_EMPLOYEE"],
    mutationFn: (id: string) =>
      api.patch(`/employees/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => {
      invalidateEmployeeListQuery();
    },
  });

export default useDeactivateEmployeeMutation;
