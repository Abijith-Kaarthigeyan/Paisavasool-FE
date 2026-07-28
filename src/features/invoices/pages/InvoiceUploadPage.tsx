import React from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { resetUploadState } from "../../invoice-upload/slices/invoiceUploadSlice"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { useToast } from "@/components/ui/toast"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { uploadFile, isLoading } = useInvoiceUpload()

  const handleFileSelect = async (file: File) => {
    try {
      const data = await uploadFile(file)
      toast({
        title: "Upload started",
        description: file.name,
        type: "success",
      })
      dispatch(resetUploadState())
      navigate(`/invoice-upload/batches/${data.batch_id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed."
      toast({
        title: "Upload failed",
        description: message,
        type: "error",
      })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Invoice upload" },
        ]}
      />

      <PageHeader title="Invoice upload" description="PDF or ZIP, up to 50MB." />

      <UploadDropzone onFileSelect={handleFileSelect} isUploading={isLoading} />
    </div>
  )
}

export default InvoiceUploadPage
