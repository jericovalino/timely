import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { ApiList } from "@repo/utilities";

const BarangaySchema = z.object({
  code: z.string(),
  region_code: z.string(),
  province_code: z.string(),
  municipality_code: z.string(),
  name: z.string(),
  zip_code: z.string(),
});

export type Barangay = z.infer<typeof BarangaySchema>;

type Props = {
  api: AxiosInstance;
  municipality_code: string;
};

const getBarangayList = ({ api, municipality_code }: Props) =>
  api.get<ApiList<Barangay>>("/api/v1/barangays", {
    params: {
      municipality_code,
    },
  });

const QUERY_KEY = ["BARANGAY_LIST"];

const useBarangayListQuery = ({ api, municipality_code }: Props) => {
  return useQuery({
    queryKey: [...QUERY_KEY, municipality_code],
    queryFn: () => getBarangayList({ api, municipality_code }),
    select: ({ data: resData }) => (municipality_code ? resData.data : []),
    enabled: !!municipality_code,
  });
};

export default useBarangayListQuery;
