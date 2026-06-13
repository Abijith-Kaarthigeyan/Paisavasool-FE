import React from "react"
import { useParams, Link } from "react-router-dom"
import { usePaymentUpload, usePaymentUploadStatus } from "../hooks/usePayments"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from "lucide-react"

export const PaymentUploadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch the full upload details
  const { data: upload, isLoading: isUploadLoading, error: uploadError, refetch } = usePaymentUpload(id);

  // Poll the status until completed
  const { data: statusData } = usePaymentUploadStatus(id);

  const activeStatus = statusData?.status || upload?.status || "UPLOADED";
  const errorMessage = statusData?.error_message || upload?.error_message || null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "MATCHED": return "success";
      case "PROCESSING": return "info";
      case "UPLOADED": return "secondary";
      case "REVIEW_REQUIRED": return "warning";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const getStepState = (step: number) => {
    // Steps: 1: Ingested, 2: Extracted & Validated, 3: Match / Review Queue
    if (activeStatus === "FAILED") {
      if (step === 3) return "failed";
      return "completed";
    }

    if (activeStatus === "MATCHED") {
      return "completed";
    }

    if (activeStatus === "REVIEW_REQUIRED") {
      if (step === 3) return "warning";
      return "completed";
    }

    if (activeStatus === "PROCESSING") {
      if (step === 1) return "completed";
      if (step === 2) return "active";
      return "upcoming";
    }

    // UPLOADED
    if (step === 1) return "active";
    return "upcoming";
  };

  if (isUploadLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (uploadError || !upload) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Payment Record Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested payment upload details could not be loaded.</p>
        <Link to="/payment-upload-history" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/payment-upload-history" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Payment Ingestion Details
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <Badge variant={getStatusVariant(activeStatus)} className="text-xs uppercase px-3 py-1 font-bold tracking-wider">
            {activeStatus.replace("_", " ")}
          </Badge>
        </div>
      </header>

      {/* Progress Stepper Visualizer */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Agent Matching Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-2">
            {/* Step 1: Ingested */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Document Ingested</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Parsed to core blob storage</p>
              </div>
            </div>

            <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-border" />

            {/* Step 2: Extraction & Validation */}
            <div className="flex items-center space-x-3">
              {getStepState(2) === "completed" ? (
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold">
                  ✓
                </div>
              ) : getStepState(2) === "active" ? (
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-bold animate-pulse">
                  <Clock className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-border font-bold">
                  2
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">AI Extraction & Validation</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">OCR metadata validation</p>
              </div>
            </div>

            <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-border" />

            {/* Step 3: Match / Review Queue */}
            <div className="flex items-center space-x-3">
              {getStepState(3) === "completed" ? (
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold">
                  ✓
                </div>
              ) : getStepState(3) === "warning" ? (
                <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 font-bold">
                  !
                </div>
              ) : getStepState(3) === "failed" ? (
                <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 font-bold">
                  ✕
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border border-border font-bold">
                  3
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">Matching Resolution</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {activeStatus === "MATCHED" && "Matched & Auto Approved"}
                  {activeStatus === "REVIEW_REQUIRED" && "Uncertainty / Human Queue"}
                  {activeStatus === "FAILED" && "Matching failed"}
                  {(activeStatus === "UPLOADED" || activeStatus === "PROCESSING") && "Pending analysis"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failure Alerts */}
      {errorMessage && (
        <Card className="border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-400">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <h5 className="text-sm font-semibold">Processing Ambiguity / Ingest Failure</h5>
              <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Metadata info */}
        <div className="space-y-6">
          <Card className="border-border shadow-xs h-fit">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3.5 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">File Name</span>
                <span className="font-semibold text-foreground truncate max-w-full mt-0.5">{upload.file_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Uploaded At</span>
                <span className="font-semibold text-foreground mt-0.5">{new Date(upload.uploaded_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Ingested By</span>
                <span className="font-semibold text-foreground text-xs mt-0.5">Finance Associate</span>
              </div>
              <div className="flex flex-col border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Current Match status</span>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(activeStatus)} className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2">
                    {activeStatus.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extracted text container */}
        <div className="md:col-span-2">
          <Card className="border-border shadow-xs h-full min-h-[350px]">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Plain Text Extracted
              </CardTitle>
              <CardDescription>Plain text extracted from PDF receipt by internal OCR service.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {upload.raw_text ? (
                <pre className="rounded-lg bg-slate-50 dark:bg-zinc-900/50 p-4 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-border">
                  {upload.raw_text}
                </pre>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs italic bg-slate-50/50 dark:bg-zinc-900/40 border rounded-lg">
                  OCR text processing in progress or text empty...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentUploadDetailPage;
