import { disputeApi } from "@/lib/axios"
import { isAxiosError } from "axios"
import {
  Dispute,
  DisputeCase,
  CaseAttachment,
  DisputeReviewQueueItem,
  DisputeActivity,
  DisputeComment,
  DisputeResolutionRecommendation,
  DisputeCommunication,
  DisputeCommunicationDraft,
  DisputeEvidenceSnapshot,
  DisputeWorkflowContext,
  DisputeSLA,
} from "../types"

export const disputeService = {
  getDisputes: async (params?: { customer_id?: string; status?: string }): Promise<Dispute[]> => {
    const response = await disputeApi.get<Dispute[]>("/disputes", { params });
    return response.data;
  },

  getDispute: async (id: string): Promise<Dispute> => {
    const response = await disputeApi.get<Dispute>(`/disputes/${id}`);
    return response.data;
  },

  getCases: async (): Promise<DisputeCase[]> => {
    const response = await disputeApi.get<DisputeCase[]>("/cases");
    return response.data;
  },

  getCase: async (id: string): Promise<DisputeCase> => {
    const response = await disputeApi.get<DisputeCase>(`/cases/${id}`);
    return response.data;
  },

  getCaseDisputes: async (caseId: string): Promise<Dispute[]> => {
    const response = await disputeApi.get<Dispute[]>(`/cases/${caseId}/disputes`);
    return response.data;
  },

  getCaseAttachments: async (caseId: string): Promise<CaseAttachment[]> => {
    const response = await disputeApi.get<CaseAttachment[]>(`/cases/${caseId}/attachments`);
    return response.data;
  },

  downloadCaseAttachmentFile: async (
    caseId: string,
    attachmentId: string
  ): Promise<Blob> => {
    const response = await disputeApi.get(
      `/cases/${caseId}/attachments/${attachmentId}/file`,
      { responseType: "blob" }
    );
    const blob = response.data as Blob;
    if (blob.type === "application/json") {
      const message = await blob.text();
      throw new Error(message || "Failed to download attachment");
    }
    return blob;
  },

  openCaseAttachmentInTab: async (
    targetTab: Window | null,
    caseId: string,
    attachmentId: string,
    filename: string
  ): Promise<void> => {
    const blob = await disputeService.downloadCaseAttachmentFile(caseId, attachmentId);
    const pdfBlob =
      blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" });
    const url = URL.createObjectURL(pdfBlob);

    if (targetTab && !targetTab.closed) {
      targetTab.location.href = url;
      targetTab.document.title = filename;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  getReviewQueue: async (status?: string): Promise<DisputeReviewQueueItem[]> => {
    const response = await disputeApi.get<DisputeReviewQueueItem[]>("/review-queue", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  resolveReviewItem: async (
    id: string,
    payload: { invoice_number: string; dispute_category: string; comments?: string }
  ): Promise<{ status: string; message: string }> => {
    const response = await disputeApi.post<{ status: string; message: string }>(
      `/review-queue/${id}/resolve`,
      payload
    );
    return response.data;
  },

  getActivities: async (disputeId: string): Promise<DisputeActivity[]> => {
    const response = await disputeApi.get<DisputeActivity[]>(`/disputes/${disputeId}/activities`);
    return response.data;
  },

  getComments: async (disputeId: string): Promise<DisputeComment[]> => {
    const response = await disputeApi.get<DisputeComment[]>(`/disputes/${disputeId}/comments`);
    return response.data;
  },

  createComment: async (
    disputeId: string,
    payload: { comment: string; comment_type?: string }
  ): Promise<DisputeComment> => {
    const response = await disputeApi.post<DisputeComment>(
      `/disputes/${disputeId}/comments`,
      payload
    );
    return response.data;
  },

  getRecommendations: async (disputeId: string): Promise<DisputeResolutionRecommendation[]> => {
    const response = await disputeApi.get<DisputeResolutionRecommendation[]>(
      `/disputes/${disputeId}/recommendations`
    );
    return response.data;
  },

  getCommunications: async (disputeId: string): Promise<DisputeCommunication[]> => {
    const response = await disputeApi.get<DisputeCommunication[]>(
      `/disputes/${disputeId}/communications`
    );
    return response.data;
  },

  getLatestCommunicationDraft: async (
    disputeId: string
  ): Promise<DisputeCommunicationDraft | null> => {
    try {
      const response = await disputeApi.get<DisputeCommunicationDraft>(
        `/disputes/${disputeId}/communications/draft/latest`
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  draftCommunication: async (
    disputeId: string,
    payload?: { instructions?: string }
  ): Promise<DisputeCommunicationDraft> => {
    const response = await disputeApi.post<DisputeCommunicationDraft>(
      `/disputes/${disputeId}/communications/draft`,
      payload ?? {}
    );
    return response.data;
  },

  sendCommunication: async (
    disputeId: string,
    payload: { recipient: string; subject: string; body: string }
  ): Promise<DisputeCommunication> => {
    const response = await disputeApi.post<DisputeCommunication>(
      `/disputes/${disputeId}/communications/send`,
      payload
    );
    return response.data;
  },

  getEvidence: async (disputeId: string): Promise<DisputeEvidenceSnapshot[]> => {
    const response = await disputeApi.get<DisputeEvidenceSnapshot[]>(`/disputes/${disputeId}/evidence`);
    return response.data;
  },

  getWorkflowContext: async (disputeId: string): Promise<DisputeWorkflowContext> => {
    const response = await disputeApi.get<DisputeWorkflowContext>(
      `/disputes/${disputeId}/workflow-context`
    );
    return response.data;
  },

  getSLA: async (disputeId: string): Promise<DisputeSLA> => {
    const response = await disputeApi.get<DisputeSLA>(`/disputes/${disputeId}/sla`);
    return response.data;
  },

  submitAssociateDecision: async (
    id: string,
    payload: {
      decision: "APPROVE" | "REJECT" | "EDIT_AND_APPLY" | string;
      comments?: string;
      amended_invoice_json?: Record<string, unknown>;
    }
  ): Promise<{ status: string; message: string }> => {
    const response = await disputeApi.post<{ status: string; message: string }>(
      `/disputes/${id}/associate-decision`,
      payload
    );
    return response.data;
  },

  submitPaymentReviewDecision: async (
    id: string,
    payload: { decision: "SETTLEMENT_DONE" | "SETTLEMENT_NOT_DONE" | string; comments?: string }
  ): Promise<{ status: string; message: string }> => {
    const response = await disputeApi.post<{ status: string; message: string }>(
      `/disputes/${id}/payment-review-decision`,
      payload
    );
    return response.data;
  },

  submitOperationalDecision: async (
    id: string,
    payload: { decision: "ACKNOWLEDGED" | "REJECTED" | string; comments?: string }
  ): Promise<{ status: string; message: string }> => {
    const response = await disputeApi.post<{ status: string; message: string }>(
      `/disputes/${id}/operational-review-decision`,
      payload
    );
    return response.data;
  },

  assignDispute: async (id: string): Promise<Dispute> => {
    const response = await disputeApi.post<Dispute>(`/disputes/${id}/assign`);
    return response.data;
  },

  escalateDispute: async (
    id: string,
    payload: { comments?: string }
  ): Promise<{ status: string; message: string }> => {
    const response = await disputeApi.post<{ status: string; message: string }>(
      `/disputes/${id}/escalate`,
      payload
    );
    return response.data;
  },

  reassignDispute: async (id: string, assignedTo: string): Promise<Dispute> => {
    const response = await disputeApi.post<Dispute>(`/disputes/${id}/reassign`, {
      assigned_to: assignedTo,
    });
    return response.data;
  },
};

export default disputeService;
