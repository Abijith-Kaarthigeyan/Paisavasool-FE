import React, { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { RootState } from "@/app/store"
import { useInvoiceUpload } from "../hooks/useInvoiceUpload"
import { UploadDropzone } from "../components/UploadDropzone"
import { UploadProgress } from "../components/UploadProgress"
import { ChevronRight, Home, Upload, History } from "lucide-react"
import { resetUploadState } from "../slices/invoiceUploadSlice"

export const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, isLoading } = useInvoiceUpload();

  // Redirect link depending on active user role
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "FINANCE_MANAGER") return "/manager";
    return "/associate";
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const data = await uploadFile(file);
      // Wait 1.5 seconds on success and redirect to batch details
      setTimeout(() => {
        dispatch(resetUploadState());
        navigate(`/invoice-upload/batches/${data.batch_id}`);
      }, 1500);
    } catch (err) {
      console.error("Upload process failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground bg-card px-4 py-2.5 rounded-lg border border-border w-fit shadow-xs">
          <Link to={getDashboardPath()} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">Invoice Upload</span>
        </nav>

        {/* Header section */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Invoice Upload Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload single PDF invoices or bulk ZIP archives to trigger AI ingestion pipelines.
            </p>
          </div>
          <Link
            to={getDashboardPath()}
            className="rounded bg-secondary border border-border px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Back to Dashboard
          </Link>
        </header>

        {/* Upload Container Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Upload Zone Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Select Invoice File
              </h2>
              <UploadDropzone
                onFileSelect={handleFileSelect}
                isUploading={isLoading}
              />
            </div>

            {/* In-progress Upload Item */}
            <UploadProgress fileName={selectedFile ? selectedFile.name : null} />
          </div>

          {/* Quick Info Sidebar */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
              <History className="h-4 w-4 text-primary" /> Processing Guide
            </h2>
            <ul className="text-xs space-y-3 text-muted-foreground leading-relaxed pl-4 list-disc">
              <li>Upload individual <strong>Text PDFs</strong> only. Scanned or image-based PDFs will be skipped.</li>
              <li>Bulk uploads must be packed inside a <strong>ZIP archive</strong>.</li>
              <li>A single invoice failure will <strong>not</strong> roll back the entire batch. Succeeded files persist; failed ones go to review queue.</li>
              <li>Extracted records default to <strong>INR</strong> if currency is not specified.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
