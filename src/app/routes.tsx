import { Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ForbiddenPage } from "@/features/auth/pages/ForbiddenPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layouts/AppLayout"

// Feature pages
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { AdminDashboard } from "@/features/dashboard/pages/AdminDashboard"
import { InvoiceUploadPage } from "@/features/invoices/pages/InvoiceUploadPage"
import { BatchDetailsPage } from "@/features/invoices/pages/BatchDetailsPage"
import { InvoiceListPage } from "@/features/invoices/pages/InvoiceListPage"
import { InvoiceDetailPage } from "@/features/invoices/pages/InvoiceDetailPage"
import { PaymentUploadPage } from "@/features/payments/pages/PaymentUploadPage"
import { PaymentUploadHistoryPage } from "@/features/payments/pages/PaymentUploadHistoryPage"
import { PaymentUploadDetailPage } from "@/features/payments/pages/PaymentUploadDetailPage"
import { ReviewQueuePage } from "@/features/matching/pages/ReviewQueuePage"
import { CustomerListPage } from "@/features/customers/pages/CustomerListPage"
import { CustomerDetailPage } from "@/features/customers/pages/CustomerDetailPage"
import React from "react"

const CollectionsDashboardPage = React.lazy(() => import("@/features/collections/pages/CollectionsDashboardPage"));
const OpenCasesPage = React.lazy(() => import("@/features/collections/pages/OpenCasesPage"));
const AssignedCasesPage = React.lazy(() => import("@/features/collections/pages/AssignedCasesPage"));
const EscalatedCasesPage = React.lazy(() => import("@/features/collections/pages/EscalatedCasesPage"));
const BrokenPromisesPage = React.lazy(() => import("@/features/collections/pages/BrokenPromisesPage"));
const ReminderHistoryPage = React.lazy(() => import("@/features/collections/pages/ReminderHistoryPage"));
const CollectionCaseDetailPage = React.lazy(() => import("@/features/collections/pages/CollectionCaseDetailPage"));

const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-xs font-semibold text-muted-foreground animate-pulse">
        Loading view...
      </p>
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Protected Dashboard Layout Wrapper */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Universal Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin Specific Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Invoice Ingestion Routes */}
          <Route
            path="/invoice-upload"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <InvoiceUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-upload/batches/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <BatchDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <InvoiceListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <InvoiceDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Payment Ingestion Routes */}
          <Route
            path="/payment-upload"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <PaymentUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-upload-history"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <PaymentUploadHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-upload/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <PaymentUploadDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Matching & Review Routes */}
          <Route
            path="/payment-reviews"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />

          {/* Customer Directory Routes */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <CustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Collections Workspace Routes */}
          <Route
            path="/collections"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <CollectionsDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/open"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <OpenCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/assigned"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <AssignedCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/escalated"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER"]}>
                <EscalatedCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/broken-promises"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <BrokenPromisesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/reminders"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <ReminderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <CollectionCaseDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Backward Compatibility Redirects */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/manager" element={<Navigate to="/dashboard" replace />} />
        <Route path="/associate" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
