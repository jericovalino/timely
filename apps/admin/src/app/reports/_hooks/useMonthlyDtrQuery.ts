import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../utilities";

export type MonthlyDtrRow = {
  date: string;
  dayOfWeek: string;
  timeIn: string | null;
  timeOut: string | null;
  hoursWorked: number | null;
  lateMinutes: number;
  undertimeMinutes: number;
  status: string;
};

export type MonthlyDtrData = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: { name: string };
  };
  rows: MonthlyDtrRow[];
  totals: {
    hoursWorked: number;
    lateMinutes: number;
    undertimeMinutes: number;
  };
};

export const MONTHLY_DTR_QUERY_KEY = ["REPORTS_MONTHLY_DTR"];

type ApiMonthlyDtr = {
  employee: MonthlyDtrData["employee"];
  year: number;
  month: number;
  dailyRecords: MonthlyDtrRow[];
  totals: {
    totalDaysPresent: number;
    totalDaysAbsent: number;
    totalHoursWorked: number;
    totalLateMinutes: number;
    totalUndertimeMinutes: number;
  };
};

const getMonthlyDtr = (params: { employeeId: string; year: number; month: number }) =>
  api.get<ApiMonthlyDtr>("/reports/monthly-dtr", { params });

const useMonthlyDtrQuery = (params: { employeeId: string; year: number; month: number }) =>
  useQuery({
    queryKey: [...MONTHLY_DTR_QUERY_KEY, params],
    queryFn: () => getMonthlyDtr(params),
    placeholderData: keepPreviousData,
    enabled: Boolean(params.employeeId && params.year && params.month),
    select: ({ data: resData }): MonthlyDtrData => ({
      employee: resData.employee,
      rows: resData.dailyRecords,
      totals: {
        hoursWorked: resData.totals.totalHoursWorked,
        lateMinutes: resData.totals.totalLateMinutes,
        undertimeMinutes: resData.totals.totalUndertimeMinutes,
      },
    }),
  });

export default useMonthlyDtrQuery;
