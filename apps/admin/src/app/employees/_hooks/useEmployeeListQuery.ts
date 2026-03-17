import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryClient } from "@repo/app-providers";
import { api } from "../../../utilities";
import type { Employee } from "../schemas";

export const EMPLOYEES_QUERY_KEY = ["EMPLOYEES"];

type Params = Record<string, unknown>;

type ApiResponse = {
  employees: Employee[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

const getEmployeeList = (params: Params) =>
  api.get<ApiResponse>("/employees", { params });

export const invalidateEmployeeListQuery = () =>
  queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });

const useEmployeeListQuery = (params: Params = {}) =>
  useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, params],
    queryFn: () => getEmployeeList(params),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => ({
      list: resData.employees,
      meta: {
        page: resData.pagination.page,
        perPage: resData.pagination.limit,
        total: resData.pagination.total,
      },
    }),
  });

export default useEmployeeListQuery;
