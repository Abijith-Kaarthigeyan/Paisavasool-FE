import { combineReducers } from "@reduxjs/toolkit"
import authReducer from "@/features/auth/slices/authSlice"
import invoiceUploadReducer from "@/features/invoice-upload/slices/invoiceUploadSlice"

export const rootReducer = combineReducers({
  auth: authReducer,
  invoiceUpload: invoiceUploadReducer,
})
