import { z } from "zod";
import { debounce } from "lodash";
import { toast } from "react-toastify";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type AxiosInstance, type AxiosError } from "axios";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { getInitialAuthData } from "./AuthProvider";

export const queryClient = new QueryClient();

const debouncedToastError = debounce(toast.error, 250);

const errorResponseSchema = z.object({
  error: z.string(),
  errors: z.string(), //422 error response
  message: z.string(),
  error_description: z.string(),
  data: z
    .object({
      code: z.string().optional(),
    })
    .optional(),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

type Props = {
  children: React.ReactNode;
  api: AxiosInstance;
};

const QueryProvider = ({ children, api }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    api.interceptors.request.use((config) => {
      const authData = getInitialAuthData();
      if (!authData?.token) return config;
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${authData.token}`;
      return config;
    });

    api.interceptors.response.use(
      (config) => {
        const token = localStorage.getItem("_token");
        if (!token) return config;
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (err: AxiosError<ErrorResponse>) => {
        const code = err.response?.status;
        const data = err.response?.data?.data ?? {};
        const error = err.response?.data.error;
        const message = err.response?.data.message;

        if (error === "token_expired") {
          navigate("/logout");
          throw err;
        }
        if (code === 401) {
          debouncedToastError(message ?? "Forbidden!");
          if (message === "Token has expired" || data.code === "TOKEN_EXPIRED")
            navigate("/logout");
          throw err;
        }
        if (err.status === 403) {
          debouncedToastError(message ?? "Forbidden!");
          if (message === "Invalid token." || message === "Token expired.")
            navigate("/logout");
          throw err;
        }
        if (code === 400) {
          if (error === "otp_not_resendable") throw err;
          debouncedToastError(message ?? "Bad Request!");
          throw err;
        }
        if (code === 404) {
          debouncedToastError(message ?? "Not Found!");
          throw err;
        }
        if (code === 429) {
          debouncedToastError(message ?? "Too many request!");
          throw err;
        }
        if (code === 500) {
          debouncedToastError("Internal Server Error!");
          throw err;
        }
        if (code === 0) {
          debouncedToastError("Unable to connect to web service");
          throw err;
        }
        throw err;
      },
    );
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default QueryProvider;
