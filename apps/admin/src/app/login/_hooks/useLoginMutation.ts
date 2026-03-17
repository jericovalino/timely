import { useMutation } from "@tanstack/react-query";
import { api } from "../../../utilities";
import type { LoginPayload, LoginResponse } from "../schemas";

const login = (payload: LoginPayload) =>
  api
    .post<LoginResponse>("/auth/login", payload)
    .then((res) => res.data);

const useLoginMutation = () =>
  useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: login,
  });

export default useLoginMutation;
