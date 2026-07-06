import { Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ForbiddenPage } from "@/features/auth/pages/ForbiddenPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layouts/AppLayout"

// Feature pages
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { AdminDashboard } from "@/features/dashboard/pages/AdminDashboard"
import { BatchDetailsPage } from "@/features/invoices/pages/BatchDetailsPage"
import { InvoiceListPage } from "@/features/invoices/pages/InvoiceListPage"
import { InvoiceDetailPage } from "@/features/invoices/pages/InvoiceDetailPage"
import { UnifiedUploadPage } from "@/features/document-upload/pages/UnifiedUploadPage"
import { UnifiedUploadHubPage } from "@/features/document-upload/pages/UnifiedUploadHubPage"
import { PaymentUploadHistoryPage } from "@/features/payments/pages/PaymentUploadHistoryPage"
import { PaymentUploadDetailPage } from "@/features/payments/pages/PaymentUploadDetailPage"
import { ReviewQueuePage } from "@/features/matching/pages/ReviewQueuePage"
import { CustomerListPage } from "@/features/customers/pages/CustomerListPage"
import { CustomerDetailPage } from "@/features/customers/pages/CustomerDetailPage"
import React from "react"
import { RouteContentSkeleton } from "@/components/layouts/RouteContentSkeleton"

const CollectionsDashboardPage = React.lazy(() => import("@/features/collections/pages/CollectionsDashboardPage"));
const OpenCasesPage = React.lazy(() => import("@/features/collections/pages/OpenCasesPage"));
const AssignedCasesPage = React.lazy(() => import("@/features/collections/pages/AssignedCasesPage"));
const EscalatedCasesPage = React.lazy(() => import("@/features/collections/pages/EscalatedCasesPage"));
const BrokenPromisesPage = React.lazy(() => import("@/features/collections/pages/BrokenPromisesPage"));
const ReminderHistoryPage = React.lazy(() => import("@/features/collections/pages/ReminderHistoryPage"));
const CollectionCaseDetailPage = React.lazy(() => import("@/features/collections/pages/CollectionCaseDetailPage"));

// Dispute feature pages
const DisputeDashboardPage = React.lazy(() => import("@/features/disputes/pages/DisputeDashboardPage"));
const CasesListPage = React.lazy(() => import("@/features/disputes/pages/CasesListPage"));
const CaseDetailsPage = React.lazy(() => import("@/features/disputes/pages/CaseDetailsPage"));
const OpenDisputesPage = React.lazy(() => import("@/features/disputes/pages/OpenDisputesPage"));
const AllDisputesPage = React.lazy(() => import("@/features/disputes/pages/AllDisputesPage"));
const MyAssignedDisputesPage = React.lazy(() => import("@/features/disputes/pages/MyAssignedDisputesPage"));
const EscalatedDisputesPage = React.lazy(() => import("@/features/disputes/pages/EscalatedDisputesPage"));
const DisputeReviewQueuePage = React.lazy(() => import("@/features/disputes/pages/ReviewQueuePage"));
const WaitingCustomerPage = React.lazy(() => import("@/features/disputes/pages/WaitingCustomerPage"));
const WaitingInternalTeamPage = React.lazy(() => import("@/features/disputes/pages/WaitingInternalTeamPage"));
const DisputeDetailPage = React.lazy(() => import("@/features/disputes/pages/DisputeDetailPage"));
const EmailReviewPage = React.lazy(() => import("@/features/email-intake/pages/EmailReviewPage"));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteContentSkeleton />}>
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

          {/* Unified Document Upload */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <UnifiedUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload/sessions/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <UnifiedUploadHubPage />
              </ProtectedRoute>
            }
          />

          {/* Invoice Ingestion Routes */}
          <Route
            path="/invoice-upload"
            element={<Navigate to="/upload" replace />}
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
            element={<Navigate to="/upload" replace />}
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
          <Route
            path="/email-review"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <EmailReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Customer Directory Routes */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <CustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
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

          {/* Dispute Management Routes */}
          <Route
            path="/disputes"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <DisputeDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/open"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <OpenDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/all"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <AllDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/assigned"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_ASSOCIATE"]}>
                <MyAssignedDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/escalated"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <EscalatedDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/review-queue"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <DisputeReviewQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/waiting-customer"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <WaitingCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/waiting-internal"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <WaitingInternalTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/cases"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <CasesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/cases/:caseId"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <CaseDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes/:disputeId"
            element={
              <ProtectedRoute allowedRoles={["FINANCE_MANAGER", "FINANCE_ASSOCIATE"]}>
                <DisputeDetailPage />
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
