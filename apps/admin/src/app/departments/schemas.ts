import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Required"),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Required"),
});

export type CreateDepartmentPayload = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentPayload = z.infer<typeof updateDepartmentSchema>;

export type Department = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
