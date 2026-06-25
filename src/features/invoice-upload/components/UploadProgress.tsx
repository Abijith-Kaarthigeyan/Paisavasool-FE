import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadProgressProps {
  fileName: string | null
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ fileName }) => {
  const { uploadProgress, uploadStatus } = useSelector(
    (state: RootState) => state.invoiceUpload
  )

  if (uploadStatus === "idle") return null

  const statusMessage =
    uploadStatus === "uploading"
      ? `Uploading: ${uploadProgress}%`
      : uploadStatus === "success"
        ? "Upload completed successfully. Processing batch…"
        : "Upload failed. Please try again."

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          {uploadStatus === "uploading" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          )}
          {uploadStatus === "success" && (
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
          )}
          {uploadStatus === "error" && (
            <XCircle className="h-5 w-5 text-destructive" aria-hidden />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {fileName || "Processing file…"}
            </p>
            <p className="text-xs text-muted-foreground">{statusMessage}</p>
          </div>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={uploadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              uploadStatus === "error"
                ? "bg-destructive"
                : uploadStatus === "success"
                  ? "bg-success"
                  : "bg-primary"
            )}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
