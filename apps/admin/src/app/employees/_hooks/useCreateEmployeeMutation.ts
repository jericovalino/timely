import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { CreateEmployeePayload } from "../schemas";
import { invalidateEmployeeListQuery } from "./useEmployeeListQuery";

const useCreateEmployeeMutation = () =>
  useMutation({
    mutationKey: ["CREATE_EMPLOYEE"],
    mutationFn: (payload: CreateEmployeePayload) =>
      api.post("/employees", payload).then((r) => r.data),
    onSuccess: () => {
      invalidateEmployeeListQuery();
    },
  });

export default useCreateEmployeeMutation;
