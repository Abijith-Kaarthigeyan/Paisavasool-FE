import { useDispatch } from "react-redux"
import { useMutation } from "@tanstack/react-query"
import { invoiceUploadService } from "../services/invoiceUploadService"
import {
  startUpload,
  setUploadProgress,
  uploadSuccess,
  uploadFailure,
} from "../slices/invoiceUploadSlice"

export const useInvoiceUpload = () => {
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      dispatch(startUpload());
      const ext = file.name.split(".").pop()?.toLowerCase();
      
      const onProgress = (percent: number) => {
        dispatch(setUploadProgress(percent));
      };

      if (ext === "pdf") {
        return await invoiceUploadService.uploadPdf(file, onProgress);
      } else if (ext === "zip") {
        return await invoiceUploadService.uploadZip(file, onProgress);
      } else {
        throw new Error("Unsupported file format. Please upload PDF or ZIP.");
      }
    },
    onSuccess: (data) => {
      dispatch(uploadSuccess(data.batch_id));
    },
    onError: (error) => {
      console.error("File upload failed:", error);
      dispatch(uploadFailure());
    },
  });

  return {
    uploadFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
