import z from "zod";
import {
  type ApiData,
  type ApiList,
  type ApiListData,
  type ListMeta,
} from "./types";

export type ValidSchema = any;

type GenerateMockDataFromZodSchemaProps<
  TData extends ValidSchema,
  TType extends "data" | "list" | "paginatedList",
> = {
  dataSchema: TData;
  readonly type: TType;
  override?: () => z.infer<TData>;
};

export type GenerateMockDataFromZodSchemaReturnType<
  TData extends ValidSchema,
  TType extends "data" | "list" | "paginatedList",
> = TType extends "data"
  ? ApiData<z.infer<TData>>
  : TType extends "list"
    ? ApiList<z.infer<TData>>
    : TType extends "paginatedList"
      ? ApiListData<z.infer<TData>>
      : never;

const generateMockDataFromZodSchema = <
  TData extends ValidSchema,
  const TType extends "data" | "list" | "paginatedList",
>({
  dataSchema: _dataSchema,
  type,
  override,
}: GenerateMockDataFromZodSchemaProps<TData, TType>): TType extends "data"
  ? ApiData<z.infer<TData>>
  : TType extends "list"
    ? ApiList<z.infer<TData>>
    : TType extends "paginatedList"
      ? ApiListData<z.infer<TData>>
      : never => {
  if (type === "data") {
    // @ts-expect-error
    return {
      data: override ? override() : null,
    } as ApiData<TData>;
  }

  if (type === "list") {
    const data: z.infer<TData>[] = [];
    [0, 1, 2].forEach(() => {
      data.push(override?.() as z.infer<TData>);
    });
    // @ts-expect-error
    return {
      data: override ? data : null,
    } as ApiList<TData>;
  }

  if (type === "paginatedList") {
    const data: z.infer<TData>[] = [];
    [0, 1, 2].forEach(() => {
      data.push(override?.() as z.infer<TData>);
    });
    // @ts-expect-error
    return {
      data: override ? data : null,
      meta: {
        current_page: 1,
        last_page: 4,
        from: 1,
        to: 15,
        total: 37,
        per_page: 15,
        path: "",
        links: "" as any,
      } satisfies ListMeta,
    } as ApiListData<TData>;
  }

  return override ? (override() as any) : (null as any);
};

export default generateMockDataFromZodSchema;
