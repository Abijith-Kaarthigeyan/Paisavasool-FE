import React, { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { RootState } from "@/app/store"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { UploadProgress } from "../components/UploadProgress"
import { resetUploadState } from "../slices/invoiceUploadSlice"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ChevronRight, Home, Upload, History } from "lucide-react"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { uploadFile, isLoading } = useInvoiceUpload()

  const getDashboardPath = () => {
    if (!user) return "/login"
    if (user.role === "ADMIN") return "/admin"
    if (user.role === "FINANCE_MANAGER") return "/manager"
    return "/associate"
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    try {
      const data = await uploadFile(file)
      setTimeout(() => {
        dispatch(resetUploadState())
        navigate(`/invoice-upload/batches/${data.batch_id}`)
      }, 1500)
    } catch (err) {
      console.error("Upload process failed", err)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <nav
        className="flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          to={getDashboardPath()}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-foreground">Invoice upload</span>
      </nav>

      <PageHeader
        title="Invoice upload center"
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(getDashboardPath())}>
            Back to dashboard
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Upload className="h-4 w-4 text-primary" aria-hidden />
                Select invoice file
              </CardTitle>
              <CardDescription>
                Drag and drop a PDF or ZIP archive to begin ingestion.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UploadDropzone onFileSelect={handleFileSelect} isUploading={isLoading} />
            </CardContent>
          </Card>

          <UploadProgress fileName={selectedFile ? selectedFile.name : null} />
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <History className="h-4 w-4 text-primary" aria-hidden />
              Processing guide
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="list-disc space-y-3 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                Upload individual <strong className="text-foreground">text PDFs</strong> only.
                Scanned or image-based PDFs will be skipped.
              </li>
              <li>
                Bulk uploads must be packed inside a{" "}
                <strong className="text-foreground">ZIP archive</strong>.
              </li>
              <li>
                A single invoice failure will <strong className="text-foreground">not</strong>{" "}
                roll back the entire batch. Succeeded files persist; failed ones go to review
                queue.
              </li>
              <li>
                Extracted records default to <strong className="text-foreground">INR</strong> if
                currency is not specified.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
