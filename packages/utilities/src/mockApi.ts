import type z from "zod";
import generateMockDataFromZodSchema, {
  type ValidSchema,
  type GenerateMockDataFromZodSchemaReturnType,
} from "./generateMockDataFromZodSchema";

const mockApi = {
  get: <
    TData extends ValidSchema,
    TType extends "data" | "list" | "paginatedList",
  >({
    dataSchema,
    type,
    override,
  }: {
    dataSchema: TData;
    type: TType;
    override?: () => z.infer<TData>;
  }): Promise<GenerateMockDataFromZodSchemaReturnType<TData, TType>> =>
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve(
            generateMockDataFromZodSchema({ dataSchema, type, override })
          ),
        200
      );
    }),
  post: <
    TData extends ValidSchema,
    TType extends "data" | "list" | "paginatedList",
  >({
    dataSchema,
    type,
    override,
  }: {
    dataSchema: TData;
    type: TType;
    override?: () => z.infer<TData>;
  }): Promise<GenerateMockDataFromZodSchemaReturnType<TData, TType>> =>
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve(
            generateMockDataFromZodSchema({ dataSchema, type, override })
          ),
        200
      );
    }),
  put: <
    TData extends ValidSchema,
    TType extends "data" | "list" | "paginatedList",
  >({
    dataSchema,
    type,
    override,
  }: {
    dataSchema: TData;
    type: TType;
    override?: () => z.infer<TData>;
  }): Promise<GenerateMockDataFromZodSchemaReturnType<TData, TType>> =>
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve(
            generateMockDataFromZodSchema({ dataSchema, type, override })
          ),
        200
      );
    }),
};

export default mockApi;
