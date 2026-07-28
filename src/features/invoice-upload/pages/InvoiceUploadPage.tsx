import React from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { resetUploadState } from "../slices/invoiceUploadSlice"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { uploadFile, isLoading } = useInvoiceUpload()

  const handleFileSelect = async (file: File) => {
    try {
      const data = await uploadFile(file)
      dispatch(resetUploadState())
      navigate(`/invoice-upload/batches/${data.batch_id}`)
    } catch (err) {
      console.error("Upload process failed", err)
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
