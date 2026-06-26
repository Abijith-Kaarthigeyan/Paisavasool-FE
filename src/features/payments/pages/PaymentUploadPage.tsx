import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { paymentService } from "../services/paymentService"
import { PaymentUploadDropzone } from "../components/PaymentUploadDropzone"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/components/ui/toast"
import { Upload, Info, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export const PaymentUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => paymentService.uploadPaymentPdf(file),
    onSuccess: (data) => {
      toast({
        title: "Payment uploaded",
        description: "PDF has been uploaded successfully. Launching agent workflows.",
        type: "success",
      })
      setTimeout(() => {
        navigate(`/payment-upload/${data.upload_id}`)
      }, 1500)
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setSelectedFile(null)
      toast({
        title: "Upload failed",
        description: axiosErr.response?.data?.detail || "An error occurred during file upload.",
        type: "error",
      })
    },
  })

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    uploadMutation.mutate(file)
  }

  const uploadStatus = uploadMutation.isPending
    ? "uploading"
    : uploadMutation.isSuccess
      ? "success"
      : uploadMutation.isError
        ? "error"
        : "idle"

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Payment ingestion center"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Upload className="h-4 w-4 text-primary" aria-hidden />
                Ingest payment confirmation
              </CardTitle>
              <CardDescription>
                Upload a single transaction PDF. The payment matching agent will process it in the background.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <PaymentUploadDropzone
                onFileSelect={handleFileSelect}
                isUploading={uploadMutation.isPending}
              />
            </CardContent>
          </Card>

          {selectedFile && uploadStatus !== "idle" && (
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
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadStatus === "uploading" && "Uploading file to central gateway…"}
                      {uploadStatus === "success" &&
                        "Upload successful. Ingestion pipeline active. Redirecting…"}
                      {uploadStatus === "error" && "Validation or connection error occurred."}
                    </p>
                  </div>
                </div>

                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={uploadStatus === "success" ? 100 : uploadStatus === "uploading" ? 50 : 0}
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
                    style={{
                      width:
                        uploadStatus === "success"
                          ? "100%"
                          : uploadStatus === "uploading"
                            ? "50%"
                            : "0%",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Info className="h-4 w-4 text-primary" aria-hidden />
              Processing guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="list-disc space-y-3 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                Upload <strong className="text-foreground">PDF receipts</strong> or wire transfer
                confirmations only.
              </li>
              <li>
                Maximum file size is <strong className="text-foreground">20MB</strong> per upload.
              </li>
              <li>
                The matching agent will attempt automatic customer and invoice allocation after OCR
                extraction.
              </li>
              <li>
                Low-confidence matches are routed to the{" "}
                <strong className="text-foreground">human review queue</strong> for manual
                resolution.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PaymentUploadPage
