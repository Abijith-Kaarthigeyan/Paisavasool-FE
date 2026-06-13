import { z } from "zod"

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const fileUploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file instanceof File, "File is required")
    .refine(
      (file) => file && file.size <= MAX_FILE_SIZE,
      `Max file size is 50MB.`
    )
    .refine(
      (file) => {
        if (!file) return false;
        const extension = file.name.split(".").pop()?.toLowerCase();
        return extension === "pdf" || extension === "zip";
      },
      "Only PDF and ZIP files are supported."
    ),
});

export type FileUploadFormValues = z.infer<typeof fileUploadSchema>;
export default fileUploadSchema;
