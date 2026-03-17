import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import { invalidateAttendanceListQuery } from "./useAttendanceListQuery";

type UpdateAttendancePayload = {
  id: string;
  timeIn?: string;
  timeOut?: string;
  adminNote?: string;
};

const updateAttendance = ({ id, ...body }: UpdateAttendancePayload) =>
  api.patch(`/attendance/${id}`, body).then((r) => r.data);

const useUpdateAttendanceMutation = () =>
  useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      invalidateAttendanceListQuery();
    },
  });

export default useUpdateAttendanceMutation;
