import { useMutation, useQuery } from "@tanstack/react-query"
import { documentUploadService } from "../services/documentUploadService"
import type { DocumentUploadConfirmRequest } from "../types"

export const useDocumentUploadIngest = () => {
  return useMutation({
    mutationFn: (file: File) => documentUploadService.ingest(file),
  })
}

export const useDocumentUploadConfirm = (sessionId: string | undefined) => {
  return useMutation({
    mutationFn: (body: DocumentUploadConfirmRequest) => {
      if (!sessionId) throw new Error("Session ID is required")
      return documentUploadService.confirm(sessionId, body)
    },
  })
}

export const useDocumentUploadSession = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ["document-upload-session", sessionId],
    queryFn: () => documentUploadService.getSession(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "COMPLETED" || status === "FAILED") {
        return false
      }
      return 2000
    },
  })
}
