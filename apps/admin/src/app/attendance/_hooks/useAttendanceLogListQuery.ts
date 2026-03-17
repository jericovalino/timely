import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../utilities";

export type AttendanceLog = {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  date: string;
  scannedAt: string;
  type: "IN" | "OUT" | "IGNORED";
};

export const ATTENDANCE_LOGS_QUERY_KEY = ["ATTENDANCE_LOGS"];

type Params = {
  page?: number;
  limit?: number;
};

type ApiResponse = {
  logs: AttendanceLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

const getAttendanceLogList = (params: Params) =>
  api.get<ApiResponse>("/attendance/logs", { params });

const useAttendanceLogListQuery = (params: Params = {}) =>
  useQuery({
    queryKey: [...ATTENDANCE_LOGS_QUERY_KEY, params],
    queryFn: () => getAttendanceLogList(params),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => ({
      list: resData.logs,
      meta: {
        page: resData.pagination.page,
        perPage: resData.pagination.limit,
        total: resData.pagination.total,
      },
    }),
  });

export default useAttendanceLogListQuery;
