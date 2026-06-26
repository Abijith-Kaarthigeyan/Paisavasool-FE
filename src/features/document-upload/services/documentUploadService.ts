import { arApi } from "@/lib/axios"
import type {
  DocumentUploadConfirmRequest,
  DocumentUploadIngestResponse,
  DocumentUploadSession,
} from "../types"

export const documentUploadService = {
  ingest: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<DocumentUploadIngestResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await arApi.post<DocumentUploadIngestResponse>(
      "/document-upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percent)
          }
        },
      }
    )
    return response.data
  },

  getSession: async (sessionId: string): Promise<DocumentUploadSession> => {
    const response = await arApi.get<DocumentUploadSession>(
      `/document-upload/sessions/${sessionId}`
    )
    return response.data
  },

  confirm: async (
    sessionId: string,
    body: DocumentUploadConfirmRequest
  ): Promise<DocumentUploadSession> => {
    const response = await arApi.post<DocumentUploadSession>(
      `/document-upload/sessions/${sessionId}/confirm`,
      body
    )
    return response.data
  },
}

export default documentUploadService
