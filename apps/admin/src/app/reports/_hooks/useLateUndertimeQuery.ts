import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../utilities";

export type LateUndertimeRow = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department?: { name: string };
  };
  date: string;
  lateMinutes: number;
  undertimeMinutes: number;
};

export const LATE_UNDERTIME_QUERY_KEY = ["REPORTS_LATE_UNDERTIME"];

type ApiResponse = { records: LateUndertimeRow[]; from: string; to: string; totals: Record<string, number> };

const getLateUndertime = (params: { from?: string; to?: string }) =>
  api.get<ApiResponse>("/reports/late-undertime", { params });

const useLateUndertimeQuery = (params: { from?: string; to?: string }) =>
  useQuery({
    queryKey: [...LATE_UNDERTIME_QUERY_KEY, params],
    queryFn: () => getLateUndertime(params),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => resData.records,
  });

export default useLateUndertimeQuery;
