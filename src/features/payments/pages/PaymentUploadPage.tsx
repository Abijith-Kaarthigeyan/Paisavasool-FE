import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { paymentService } from "../services/paymentService"
import { PaymentUploadDropzone } from "../components/PaymentUploadDropzone"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react"

export const PaymentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => paymentService.uploadPaymentPdf(file),
    onSuccess: (data) => {
      toast({
        title: "Payment Uploaded",
        description: "PDF has been uploaded successfully. Launching agent workflows.",
        type: "success",
      });
      // Redirect to payment upload details page after 1.5 seconds
      setTimeout(() => {
        navigate(`/payment-upload/${data.upload_id}`);
      }, 1500);
    },
    onError: (err: any) => {
      setSelectedFile(null);
      toast({
        title: "Upload Failed",
        description: err.response?.data?.detail || "An error occurred during file upload.",
        type: "error",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <header className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
          Payment Ingestion Gateway
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload bank transaction receipts, wire transfers, or statement PDFs to match them against open customer balances.
        </p>
      </header>

      <div className="space-y-6">
        {/* Upload Container */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary animate-pulse" /> Ingest Payment Confirmation
            </CardTitle>
            <CardDescription>Upload a single transaction PDF. The Payment Matching Agent will process it in the background.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentUploadDropzone
              onFileSelect={handleFileSelect}
              isUploading={uploadMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Upload & Processing Status Visuals */}
        {selectedFile && (
          <Card className="border-border shadow-xs animate-pulse">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : uploadMutation.isSuccess ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground truncate max-w-[280px]">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {uploadMutation.isPending && "Uploading file to central gateway..."}
                    {uploadMutation.isSuccess && "Upload successful! Ingestion pipeline active. Redirecting..."}
                    {uploadMutation.isError && "Validation or connection error occurred."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentUploadPage;
