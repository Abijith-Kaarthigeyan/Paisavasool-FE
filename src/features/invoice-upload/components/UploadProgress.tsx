import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface UploadProgressProps {
  fileName: string | null;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ fileName }) => {
  const { uploadProgress, uploadStatus } = useSelector(
    (state: RootState) => state.invoiceUpload
  );

  if (uploadStatus === "idle") return null;

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {uploadStatus === "uploading" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {uploadStatus === "success" && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
          {uploadStatus === "error" && (
            <XCircle className="h-5 w-5 text-rose-500" />
          )}
          
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground truncate max-w-[250px]">
              {fileName || "Processing file..."}
            </span>
            <span className="text-xs text-muted-foreground">
              {uploadStatus === "uploading" && `Uploading: ${uploadProgress}%`}
              {uploadStatus === "success" && "Upload completed successfully. Processing batch..."}
              {uploadStatus === "error" && "Upload failed. Please try again."}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            uploadStatus === "error"
              ? "bg-rose-500"
              : uploadStatus === "success"
              ? "bg-emerald-500"
              : "bg-primary animate-pulse"
          }`}
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
    </div>
  );
};
