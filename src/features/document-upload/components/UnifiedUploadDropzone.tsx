import React, { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react"
import {
  documentUploadSchema,
  DocumentUploadFormValues,
} from "../schemas/documentUploadSchema"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UnifiedUploadDropzoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadLabel?: string
}

export const UnifiedUploadDropzone: React.FC<UnifiedUploadDropzoneProps> = ({
  onFileSelect,
  isUploading,
  uploadLabel = "Analyzing documents…",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const {
    formState: { errors },
    clearErrors,
    setError,
  } = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
  })

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
    clearErrors("file")

    const result = documentUploadSchema.safeParse({ file })
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid file."
      setError("file", { type: "manual", message: errorMsg })
    } else {
      onFileSelect(file)
    }
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
          accept=".pdf,.zip"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
          aria-hidden
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">{uploadLabel}</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">
              Drop invoices, purchase orders, and payment proofs here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF or ZIP, up to 50MB</p>
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

      {errors.file && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {errors.file.message as string}
        </p>
      )}
    </div>
  )
}

export default UnifiedUploadDropzone
