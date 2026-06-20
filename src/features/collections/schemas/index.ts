import { z } from "zod"

export const createActivitySchema = z.object({
  activity_type: z.string().min(1, "Activity type is required"),
  notes: z.string().min(1, "Notes are required for manually logged activities").max(1000, "Notes cannot exceed 1000 characters"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const createPromiseSchema = z.object({
  promised_date: z.string().min(1, "Promise date is required").refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateVal = new Date(val);
    dateVal.setHours(0, 0, 0, 0);
    return dateVal >= today;
  }, "Promise date must be today or in the future"),
});

export type CreatePromiseInput = z.infer<typeof createPromiseSchema>;
