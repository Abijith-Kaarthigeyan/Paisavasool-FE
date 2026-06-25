import React, { useRef, useState } from "react"
import { UploadCloud, AlertCircle } from "lucide-react"
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
      setErrorMsg("Only PDF receipts or confirmations are supported.")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Maximum payment upload size is 20MB.")
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
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-150",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
          isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" aria-hidden />
        </div>

        <h3 className="text-base font-semibold text-foreground">
          Drag and drop payment receipt here
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Supports transaction PDF confirmation (max 20MB)
        </p>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isUploading}
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation()
            onButtonClick()
          }}
        >
          Select PDF
        </Button>
      </div>

      {errorMsg && (
        <div
          className="mt-3 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}

export default PaymentUploadDropzone
