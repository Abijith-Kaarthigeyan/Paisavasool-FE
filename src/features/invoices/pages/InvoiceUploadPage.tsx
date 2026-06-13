import React, { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { UploadProgress } from "../components/UploadProgress"
import { resetUploadState } from "../../invoice-upload/slices/invoiceUploadSlice"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Upload, Info } from "lucide-react"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, isLoading } = useInvoiceUpload();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const data = await uploadFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully. Extraction started.`,
        type: "success",
      });
      // Redirect after 1.5s
      setTimeout(() => {
        dispatch(resetUploadState());
        navigate(`/invoice-upload/batches/${data.batch_id}`);
      }, 1500);
    } catch (err: any) {
      console.error("Upload process failed", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload file to backend.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
          Invoice Ingestion Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingest billing invoices into the Accounts Receivable pipeline. Files are parsed using Gemini AI.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Upload Dropzone Container */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary animate-pulse" /> Ingest Billing Document
              </CardTitle>
              <CardDescription>Select a PDF invoice or ZIP archive to begin extraction.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone
                onFileSelect={handleFileSelect}
                isUploading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Upload Progress Indicator */}
          <UploadProgress fileName={selectedFile ? selectedFile.name : null} />
        </div>

        {/* Guides sidebar */}
        <Card className="border-border shadow-xs h-fit">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Processing Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs space-y-4 text-muted-foreground leading-relaxed pl-4 list-disc">
              <li>Upload individual <strong>Text PDFs</strong> only. Scanned image invoices will fail validation.</li>
              <li>For bulk uploads, pack files in a single <strong>ZIP archive</strong>.</li>
              <li>A single invoice failure will <strong>not</strong> rollback the entire batch. Succeeded files persist; failed ones trigger reviews.</li>
              <li>If the currency is omitted, it will default to <strong>INR</strong>.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceUploadPage;
