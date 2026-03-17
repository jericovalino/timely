import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryClient } from "@repo/app-providers";
import { api } from "../../../utilities";

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: { name: string };
  };
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  isLate: boolean;
  isUndertime: boolean;
  lateMinutes: number;
  undertimeMinutes: number;
  totalHoursWorked: number | null;
  adminNote: string | null;
};

export const ATTENDANCE_QUERY_KEY = ["ATTENDANCE"];

type Params = {
  page?: number;
  limit?: number;
  employeeId?: string;
  departmentId?: string;
  from?: string;
  to?: string;
  isLate?: boolean;
  isUndertime?: boolean;
};

type ApiResponse = {
  records: AttendanceRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

const getAttendanceList = (params: Params) =>
  api.get<ApiResponse>("/attendance", { params });

export const invalidateAttendanceListQuery = () =>
  queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });

const useAttendanceListQuery = (params: Params = {}) =>
  useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, params],
    queryFn: () => getAttendanceList(params),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => ({
      list: resData.records,
      meta: {
        page: resData.pagination.page,
        perPage: resData.pagination.limit,
        total: resData.pagination.total,
      },
    }),
  });

export default useAttendanceListQuery;
