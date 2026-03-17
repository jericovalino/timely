import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { UpdateSchedulePayload } from "../schemas";
import { invalidateScheduleListQuery } from "./useScheduleListQuery";

const useUpdateScheduleMutation = () =>
  useMutation({
    mutationKey: ["UPDATE_SCHEDULE"],
    mutationFn: ({ id, ...payload }: UpdateSchedulePayload & { id: string }) =>
      api.patch(`/schedules/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      invalidateScheduleListQuery();
    },
  });

export default useUpdateScheduleMutation;
