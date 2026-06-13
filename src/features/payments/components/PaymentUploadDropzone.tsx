import React, { useRef, useState } from "react"
import { UploadCloud, AlertCircle } from "lucide-react"

interface PaymentUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export const PaymentUploadDropzone: React.FC<PaymentUploadDropzoneProps> = ({
  onFileSelect,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSelect = (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf") {
      setErrorMsg("Only PDF receipts or confirmations are supported.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Maximum payment upload size is 20MB.");
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    validateAndSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.target.files?.[0];
    validateAndSelect(file);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border bg-card hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
        } ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={!isUploading ? onButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-pulse">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="text-base font-semibold text-foreground">
          Drag & drop payment receipt here
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports transaction PDF confirmation (Max 20MB)
        </p>

        <button
          type="button"
          disabled={isUploading}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
        >
          Select PDF
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-500 border border-rose-100 dark:border-rose-950/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
export default PaymentUploadDropzone;
