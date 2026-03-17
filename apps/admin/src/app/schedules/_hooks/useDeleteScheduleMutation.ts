import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import { invalidateScheduleListQuery } from "./useScheduleListQuery";

const useDeleteScheduleMutation = () =>
  useMutation({
    mutationKey: ["DELETE_SCHEDULE"],
    mutationFn: (id: string) =>
      api.delete(`/schedules/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateScheduleListQuery();
    },
  });

export default useDeleteScheduleMutation;
