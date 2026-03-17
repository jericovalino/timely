import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryClient } from "@repo/app-providers";
import { api } from "../../../utilities";
import type { Schedule } from "../schemas";

export const SCHEDULES_QUERY_KEY = ["SCHEDULES"];

const getScheduleList = () =>
  api.get<Schedule[]>("/schedules");

export const invalidateScheduleListQuery = () =>
  queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY });

const useScheduleListQuery = () =>
  useQuery({
    queryKey: SCHEDULES_QUERY_KEY,
    queryFn: () => getScheduleList(),
    placeholderData: keepPreviousData,
    select: ({ data: resData }) => ({
      list: resData,
    }),
  });

export default useScheduleListQuery;
