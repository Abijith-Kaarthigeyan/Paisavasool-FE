import React, { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { UploadProgress } from "../components/UploadProgress"
import { resetUploadState } from "../../invoice-upload/slices/invoiceUploadSlice"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { useToast } from "@/components/ui/toast"
import { Upload, Info } from "lucide-react"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { toast } = useToast()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { uploadFile, isLoading } = useInvoiceUpload()

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    try {
      const data = await uploadFile(file)
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully. Extraction started.`,
        type: "success",
      })
      setTimeout(() => {
        dispatch(resetUploadState())
        navigate(`/invoice-upload/batches/${data.batch_id}`)
      }, 1500)
    } catch (err: unknown) {
      console.error("Upload process failed", err)
      const message = err instanceof Error ? err.message : "Failed to upload file to backend."
      toast({
        title: "Upload failed",
        description: message,
        type: "error",
      })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Invoice ingestion center"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Upload className="h-4 w-4 text-primary" aria-hidden />
                Ingest billing document
              </CardTitle>
              <CardDescription>
                Select a PDF invoice or ZIP archive to begin extraction.
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
              <Info className="h-4 w-4 text-primary" aria-hidden />
              Processing guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="list-disc space-y-3 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>
                Upload individual <strong className="text-foreground">text PDFs</strong> only.
              </li>
              <li>
                For bulk uploads, pack files in a single{" "}
                <strong className="text-foreground">ZIP archive</strong>.
              </li>
              <li>
                A single invoice failure will <strong className="text-foreground">not</strong>{" "}
                rollback the entire batch. Succeeded files persist; failed ones trigger reviews.
              </li>
              <li>
                If the currency is omitted, it will default to{" "}
                <strong className="text-foreground">INR</strong>.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InvoiceUploadPage
