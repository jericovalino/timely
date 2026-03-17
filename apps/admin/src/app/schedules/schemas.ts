import { z } from "zod";

export const workDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const createScheduleSchema = z.object({
  name: z.string().min(1, "Required"),
  startTime: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  endTime: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  workDays: z
    .array(z.enum(workDays))
    .min(1, "At least one work day required"),
});

export const updateScheduleSchema = createScheduleSchema;

export type CreateSchedulePayload = z.infer<typeof createScheduleSchema>;
export type UpdateSchedulePayload = z.infer<typeof updateScheduleSchema>;

export type Schedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  workDays: string[];
  createdAt: string;
  updatedAt: string;
};
