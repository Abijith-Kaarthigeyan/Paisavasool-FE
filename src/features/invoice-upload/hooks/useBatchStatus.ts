import { useQuery } from "@tanstack/react-query"
import { invoiceUploadService } from "../services/invoiceUploadService"

export const useBatchStatus = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => invoiceUploadService.getBatchStatus(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // If the batch status is UPLOADED or PROCESSING, poll every 3 seconds for updates
      if (data && (data.status === "PROCESSING" || data.status === "UPLOADED")) {
        return 3000;
      }
      return false;
    },
  });
};
