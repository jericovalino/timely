import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryClient } from "@repo/app-providers";
import { api } from "../../../utilities";
import type { Department } from "../schemas";

export const DEPARTMENTS_QUERY_KEY = ["DEPARTMENTS"];

const getDepartmentList = () =>
  api.get<Department[]>("/departments");

export const invalidateDepartmentListQuery = () =>
  queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });

const useDepartmentListQuery = () =>
  useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: () => getDepartmentList(),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => ({
      list: resData,
    }),
  });

export default useDepartmentListQuery;
