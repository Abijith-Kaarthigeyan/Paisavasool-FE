import React from "react"
import { useParams, Link } from "react-router-dom"
import { useBatchStatus } from "../hooks/useInvoices"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react"

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [expandedFiles, setExpandedFiles] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (fileId: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  // Fetch status details (polled automatically every 2s until completed)
  const { data: batch, isLoading: isBatchLoading, error: batchError } = useBatchStatus(id);



  const failedFiles = React.useMemo(() => {
    if (!batch || !batch.files) return [];
    return batch.files.filter((f: any) => f.status === "FAILED");
  }, [batch]);

  const parseErrorMessage = (errorMsg: string | null) => {
    if (!errorMsg) return { reason: "Unknown error occurred.", rawText: "" };
    try {
      if (errorMsg.trim().startsWith("{")) {
        const parsed = JSON.parse(errorMsg);
        return {
          reason: parsed.reason || "Extraction failed.",
          rawText: parsed.raw_text || "",
        };
      }
    } catch (e) {
      // Fallback if it's not JSON
    }
    return { reason: errorMsg, rawText: "" };
  };

  const getBatchStatusVariant = (status: string | undefined) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "PARTIAL_SUCCESS": return "info";
      case "PROCESSING": return "default";
      case "UPLOADED": return "secondary";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return "";
    return status.replace("_", " ");
  };

  if (isBatchLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Failed to Load Batch</h3>
        <p className="text-sm text-muted-foreground">The batch details could not be found. It may be deleted or does not exist.</p>
        <Link to="/invoice-upload" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Upload Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/invoice-upload" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Batch Ingestion Details
            </h1>
          </div>
        </div>
        <div>
          <Badge variant={getBatchStatusVariant(batch.status)} className="text-xs uppercase px-3 py-1 font-bold tracking-wider">
            {formatStatus(batch.status)}
          </Badge>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Invoices</span>
              <p className="text-2xl font-bold text-foreground">{batch.total_files}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Successful Ingestion</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{batch.success_count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Failed Ingestion</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{batch.failed_count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded At</span>
              <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(batch.uploaded_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploading Status Overlay Info */}
      {(batch.status === "UPLOADED" || batch.status === "PROCESSING") && (
        <Card className="border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <p className="text-sm font-semibold m-0">
              AI model is currently extracting line items from this batch ({batch.processed_files}/{batch.total_files} files complete). Updates occur automatically.
            </p>
          </CardContent>
        </Card>
      )}



      {/* Failed Ingestion Details Table */}
      {failedFiles.length > 0 && (
        <Card className="border-rose-500/20 shadow-xs">
          <CardHeader className="pb-3 border-b border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/5 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" /> Failed Ingestion Details
            </CardTitle>
            <CardDescription className="text-rose-500/80">
              Files that could not be processed during ingestion.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3">Failure Reason</th>
                    <th className="py-3 px-3">Raw Parsed Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {failedFiles.map((file: any) => {
                    const { reason, rawText } = parseErrorMessage(file.error_message);
                    const isExpanded = !!expandedFiles[file.id];
                    return (
                      <React.Fragment key={file.id}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground max-w-[240px] truncate" title={file.file_name}>
                            {file.file_name}
                          </td>
                          <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wide">
                            {formatStatus(reason)}
                          </td>
                          <td className="py-3 px-3">
                            {rawText ? (
                              <button
                                onClick={() => toggleExpand(file.id)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    Hide Raw Text <ChevronUp className="h-3.5 w-3.5" />
                                  </>
                                ) : (
                                  <>
                                    Show Raw Text ({rawText.length} chars){" "}
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No raw text available</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && rawText && (
                          <tr>
                            <td colSpan={3} className="bg-slate-50/40 dark:bg-zinc-950/20 p-4 border-t border-b border-border">
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Raw Extracted Content
                                </span>
                                <pre className="max-h-60 overflow-y-auto rounded-lg border border-border bg-slate-100 dark:bg-zinc-900 p-3.5 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                                  {rawText}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchDetailsPage;
