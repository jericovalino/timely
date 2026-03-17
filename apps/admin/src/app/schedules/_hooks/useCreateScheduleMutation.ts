import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { CreateSchedulePayload } from "../schemas";
import { invalidateScheduleListQuery } from "./useScheduleListQuery";

const useCreateScheduleMutation = () =>
  useMutation({
    mutationKey: ["CREATE_SCHEDULE"],
    mutationFn: (payload: CreateSchedulePayload) =>
      api.post("/schedules", payload).then((r) => r.data),
    onSuccess: () => {
      invalidateScheduleListQuery();
    },
  });

export default useCreateScheduleMutation;
