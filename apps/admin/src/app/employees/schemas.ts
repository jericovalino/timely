import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, "Required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Required"),
  scheduleId: z.string().min(1, "Required"),
  position: z.string().min(1, "Required"),
  photoUrl: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  employeeNumber: z.string().min(1, "Required"),
});

export type CreateEmployeePayload = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeePayload = z.infer<typeof updateEmployeeSchema>;

export type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  department?: { id: string; name: string };
  scheduleId: string;
  schedule?: { id: string; name: string };
  position: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
