import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { ApiList } from "@repo/utilities";

const MunicipalitySchema = z.object({
  code: z.string(),
  region_code: z.string(),
  province_code: z.string(),
  name: z.string(),
  zip_code: z.string(),
});

export type Municipality = z.infer<typeof MunicipalitySchema>;

type Props = {
  api: AxiosInstance;
  province_code: string;
};

const getMunicipalityList = ({ api, province_code }: Props) =>
  api.get<ApiList<Municipality>>("/api/v1/municipalities", {
    params: {
      province_code,
    },
  });

const QUERY_KEY = ["MUNICIPALITY_LIST"];

const useMunicipalityListQuery = ({ api, province_code }: Props) => {
  return useQuery({
    queryKey: [...QUERY_KEY, province_code],
    queryFn: () => getMunicipalityList({ api, province_code }),
    select: ({ data: resData }) => (province_code ? resData.data : []),
    enabled: !!province_code,
  });
};

export default useMunicipalityListQuery;
