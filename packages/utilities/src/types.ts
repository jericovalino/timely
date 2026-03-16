import { z } from "zod";

export const listMetaSchema = z.object({
  current_page: z.number(),
  from: z.number(),
  last_page: z.number(),
  path: z.string(),
  per_page: z.number(),
  to: z.number(),
  total: z.number(),
  links: z.array(
    z.union([
      z.object({ url: z.null(), label: z.string(), active: z.boolean() }),
      z.object({ url: z.string(), label: z.string(), active: z.boolean() }),
    ]),
  ),
});

export type ListMeta = z.infer<typeof listMetaSchema>;

// export const listPaginationSchema = z.object({
//   currentPage: z.number(),
//   totalPages: z.number(),
//   totalItems: z.number(),
//   itemsPerPage: z.number(),
//   hasNextPage: z.boolean(),
//   hasPreviousPage: z.boolean(),
// });

export const listPaginationSchema = z.object({
  current_page: z.number(),
  from: z.number(),
  last_page: z.number(),
  path: z.string(),
  per_page: z.number(),
  to: z.number(),
  total: z.number(),
  links: z.array(
    z.union([
      z.object({ url: z.null(), label: z.string(), active: z.boolean() }),
      z.object({ url: z.string(), label: z.string(), active: z.boolean() }),
    ]),
  ),
});

export type ListPagination = z.infer<typeof listPaginationSchema>;

export type ApiData<T> = { data: T };
export type ApiList<T> = { data: Array<T> };
export type ApiListData<T> = { data: Array<T>; meta: ListMeta };
export type ApiPaginatedList<T> = {
  data: Array<T>;
  pagination: ListPagination;
};

export type FormErrorResponse = {
  error: string;
  message: string;
  error_description: string;
  errors: {
    [x: string]: string[];
  };
};

type TreeNode = {
  user_id: number;
  name: string;
  package: string;
  package_id: string;
  position: null;
  created_at: string;
  left: TreeNode | null;
  right: TreeNode | null;
};

const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    user_id: z.number(),
    name: z.string(),
    package: z.string(),
    package_id: z.string(),
    position: z.null(),
    created_at: z.string(),
    left: treeNodeSchema.nullable(),
    right: treeNodeSchema.nullable(),
  }),
);

export const binaryTreeSchema = z.object({
  root_user_id: z.number(),
  viewed_as: z.number(),
  tree_data: treeNodeSchema,
});

export type BinaryTree = z.infer<typeof binaryTreeSchema>;
