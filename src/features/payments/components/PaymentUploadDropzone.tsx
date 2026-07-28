import React, { useRef, useState } from "react"
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaymentUploadDropzoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
}

export const PaymentUploadDropzone: React.FC<PaymentUploadDropzoneProps> = ({
  onFileSelect,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateAndSelect = (file: File | undefined) => {
    if (!file) return
    setErrorMsg(null)

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (extension !== "pdf") {
      setErrorMsg("PDF only.")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Max file size is 20MB.")
      return
    }

    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (isUploading) return
    const file = e.dataTransfer.files?.[0]
    validateAndSelect(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (isUploading) return
    const file = e.target.files?.[0]
    validateAndSelect(file)
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-card",
          isUploading ? "cursor-wait opacity-70" : "cursor-pointer hover:border-primary/50"
        )}
        onClick={!isUploading ? onButtonClick : undefined}
        role="button"
        tabIndex={isUploading ? -1 : 0}
        onKeyDown={(e) => {
          if (!isUploading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onButtonClick()
          }
        }}
        aria-disabled={isUploading}
        aria-busy={isUploading}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
          aria-hidden
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">Drop PDF here or browse</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation()
                onButtonClick()
              }}
            >
              Choose file
            </Button>
          </>
        )}
      </div>

      {errorMsg && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {errorMsg}
        </p>
      )}
    </div>
  )
}

export default PaymentUploadDropzone
