import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { Employee } from "../schemas";

const useEmployeeDetailQuery = (id: string) =>
  useQuery({
    queryKey: ["EMPLOYEES", id],
    queryFn: () =>
      api.get<Employee>(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export default useEmployeeDetailQuery;
