import React from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { paymentService } from "../services/paymentService"
import { PaymentUploadDropzone } from "../components/PaymentUploadDropzone"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { useToast } from "@/components/ui/toast"

export const PaymentUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const uploadMutation = useMutation({
    mutationFn: (file: File) => paymentService.uploadPaymentPdf(file),
    onSuccess: (data, file) => {
      toast({
        title: "Upload started",
        description: file.name,
        type: "success",
      })
      navigate(`/payment-upload/${data.upload_id}`)
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Upload failed",
        description: axiosErr.response?.data?.detail || "Upload failed.",
        type: "error",
      })
    },
  })

  const handleFileSelect = (file: File) => {
    uploadMutation.mutate(file)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Payment upload" },
        ]}
      />

      <PageHeader title="Payment upload" description="PDF confirmation, up to 20MB." />

      <PaymentUploadDropzone
        onFileSelect={handleFileSelect}
        isUploading={uploadMutation.isPending}
      />
    </div>
  )
}

export default PaymentUploadPage
