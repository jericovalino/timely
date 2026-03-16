import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { ApiList } from "@repo/utilities";

const ProvinceSchema = z.object({
  code: z.string(),
  region_code: z.string(),
  name: z.string(),
  district: z.null(),
});

export type Province = z.infer<typeof ProvinceSchema>;

type Props = {
  api: AxiosInstance;
};

const getProvinceList = ({ api }: Props) =>
  api.get<ApiList<Province>>("/api/v1/provinces");

const QUERY_KEY = ["PROVINCE_LIST"];

const useProvinceListQuery = ({ api }: Props) => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getProvinceList({ api }),
    select: ({ data: resData }) => resData.data,
  });
};

export default useProvinceListQuery;
