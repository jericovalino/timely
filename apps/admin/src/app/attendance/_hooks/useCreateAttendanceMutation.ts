import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import { invalidateAttendanceListQuery } from "./useAttendanceListQuery";

type CreateAttendancePayload = {
  employeeId: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  adminNote?: string;
};

const createAttendance = (body: CreateAttendancePayload) =>
  api.post("/attendance", body).then((r) => r.data);

const useCreateAttendanceMutation = () =>
  useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      invalidateAttendanceListQuery();
    },
  });

export default useCreateAttendanceMutation;
