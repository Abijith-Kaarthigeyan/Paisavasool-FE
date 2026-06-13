import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface InvoiceUploadState {
  uploadProgress: number;
  uploadStatus: "idle" | "uploading" | "success" | "error";
  selectedBatchId: string | null;
}

const initialState: InvoiceUploadState = {
  uploadProgress: 0,
  uploadStatus: "idle",
  selectedBatchId: null,
};

const invoiceUploadSlice = createSlice({
  name: "invoiceUpload",
  initialState,
  reducers: {
    startUpload(state) {
      state.uploadStatus = "uploading";
      state.uploadProgress = 0;
      state.selectedBatchId = null;
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload;
    },
    uploadSuccess(state, action: PayloadAction<string>) {
      state.uploadStatus = "success";
      state.selectedBatchId = action.payload;
    },
    uploadFailure(state) {
      state.uploadStatus = "error";
      state.uploadProgress = 0;
    },
    resetUploadState(state) {
      state.uploadProgress = 0;
      state.uploadStatus = "idle";
      state.selectedBatchId = null;
    },
    setSelectedBatchId(state, action: PayloadAction<string | null>) {
      state.selectedBatchId = action.payload;
    },
  },
});

export const {
  startUpload,
  setUploadProgress,
  uploadSuccess,
  uploadFailure,
  resetUploadState,
  setSelectedBatchId,
} = invoiceUploadSlice.actions;

export default invoiceUploadSlice.reducer;
