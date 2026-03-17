import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../utilities";

export type DailySummaryRow = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: { name: string };
  };
  status: string;
  timeIn: string | null;
  timeOut: string | null;
  lateMinutes: number;
};

export const DAILY_SUMMARY_QUERY_KEY = ["REPORTS_DAILY_SUMMARY"];

type ApiResponse = { summary: DailySummaryRow[]; date: string; totals: Record<string, number> };

const getDailySummary = (date: string) =>
  api.get<ApiResponse>("/reports/daily-summary", { params: { date } });

const useDailySummaryQuery = (date: string) =>
  useQuery({
    queryKey: [...DAILY_SUMMARY_QUERY_KEY, date],
    queryFn: () => getDailySummary(date),
    placeholderData: keepPreviousData,
    enabled: Boolean(date),
    select: ({ data: resData }) => resData.summary,
  });

export default useDailySummaryQuery;
