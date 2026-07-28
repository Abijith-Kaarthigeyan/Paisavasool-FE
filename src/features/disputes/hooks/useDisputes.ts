import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useMemo } from "react"
import { RootState } from "@/app/store"
import { disputeService, DisputeListParams, CaseListParams } from "../services/disputeService"
import { invoiceService } from "@/features/invoices/services/invoiceService"
import { customerService } from "@/features/customers/services/customerService"
import { userService } from "@/features/users/services/userService"
import { asListItems } from "@/lib/table"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { Dispute, DisputeCase, DisputeReviewQueueItem, DisputeComment, DisputeClosePayload, AssociateCommunicationSendPayload } from "../types"

// Helper function to enrich disputes with Invoice, Customer, and User details
const useEnrichedDisputes = (
  disputes: Dispute[] | undefined,
  isLoadingDisputes: boolean
) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isPrivilegedUser = user?.role === "FINANCE_MANAGER" || user?.role === "ADMIN" || user?.role === "FINANCE_ASSOCIATE";

  // Keep the same PaginatedList cache shape as useInvoices / useCustomers.
  const invoicesQuery = useQuery({
    queryKey: ["invoices", { limit: 500 }],
    queryFn: () => invoiceService.getInvoices({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const customersQuery = useQuery({
    queryKey: ["customers", { limit: 500 }],
    queryFn: () => customerService.getCustomers({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    staleTime: 5 * 60 * 1000,
    enabled: isPrivilegedUser,
  });

  const disputeIds = disputes?.map((d) => d.id).join(",") || "";
  const slaQuery = useQuery({
    queryKey: ["disputeSLAs", disputeIds],
    queryFn: async () => {
      if (!disputes?.length) return new Map<string, Dispute["sla"]>();
      // Bound concurrency — unbounded Promise.all saturates the browser and
      // makes dashboards/tables feel stuck after the list itself has loaded.
      const concurrency = 8;
      const entries: Array<readonly [string, Dispute["sla"] | undefined]> = new Array(
        disputes.length
      );
      let nextIndex = 0;
      const workers = Array.from(
        { length: Math.min(concurrency, disputes.length) },
        async () => {
          while (nextIndex < disputes.length) {
            const index = nextIndex++;
            const dispute = disputes[index];
            const sla = await disputeService.getSLA(dispute.id).catch(() => undefined);
            entries[index] = [dispute.id, sla] as const;
          }
        }
      );
      await Promise.all(workers);
      return new Map(entries);
    },
    enabled: !!disputes?.length,
    staleTime: 60 * 1000,
  });

  const enrichedData = useMemo(() => {
    if (!disputes) return [];

    const invoicesMap = new Map(asListItems(invoicesQuery.data).map((i) => [i.id, i]));
    const customersMap = new Map(asListItems(customersQuery.data).map((c) => [c.id, c]));
    const usersMap = new Map(asListItems(usersQuery.data).map((u) => [u.id, u]));
    const slaMap = slaQuery.data || new Map<string, Dispute["sla"]>();

    return disputes.map((d) => {
      const invoice = invoicesMap.get(d.invoice_id);
      const customer = customersMap.get(d.customer_id);
      const assoc = d.assigned_to ? usersMap.get(d.assigned_to) : null;
      const mgr = d.manager_id ? usersMap.get(d.manager_id) : null;

      return {
        ...d,
        invoice: invoice ? {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          outstanding_amount: invoice.outstanding_amount,
          due_date: invoice.due_date,
          invoice_date: invoice.invoice_date,
          status: invoice.status,
          currency: invoice.currency,
        } : undefined,
        customer: customer ? {
          id: customer.id,
          customer_code: customer.customer_code,
          customer_name: customer.customer_name,
          email: customer.email,
        } : undefined,
        assigned_user_name: assoc ? `${assoc.first_name} ${assoc.last_name}` : d.assigned_to ? "Finance Associate" : "Unassigned",
        manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
        sla: slaMap.get(d.id),
      };
    });
  }, [disputes, invoicesQuery.data, customersQuery.data, usersQuery.data, slaQuery.data]);

  // SLA is loaded asynchronously after the list — do not block charts/tables on it.
  // Otherwise a dashboard (limit 500) or filtered table waits on hundreds of /sla calls.
  const isSlaLoading =
    !!disputes?.length && (slaQuery.isLoading || slaQuery.isFetching) && !slaQuery.data;

  return {
    data: enrichedData,
    isLoading:
      isLoadingDisputes ||
      invoicesQuery.isLoading ||
      customersQuery.isLoading ||
      (isPrivilegedUser && usersQuery.isLoading),
    isSlaLoading,
    isError:
      invoicesQuery.isError ||
      customersQuery.isError ||
      (isPrivilegedUser && usersQuery.isError),
    refetch: invoicesQuery.refetch,
  };
};

export const useDisputes = (
  params?: DisputeListParams,
  options?: { enabled?: boolean }
) => {
  const { data: page, isLoading, isFetching, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ["disputes", params],
    queryFn: () => disputeService.getDisputes(params),
    enabled: options?.enabled !== false,
    ...listQueryOptions,
  });

  const enriched = useEnrichedDisputes(page?.items, isLoading);
  return {
    ...enriched,
    total: page?.total ?? enriched.data.length,
    isFetching,
    isPlaceholderData,
    isError: enriched.isError || isError,
    refetch: async () => {
      await refetch()
      await enriched.refetch()
    },
  };
};

export const useMyAssignedDisputes = () => {
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["myAssignedDisputes"],
    queryFn: () => disputeService.getMyDisputes(),
  });

  return useEnrichedDisputes(disputes, isLoading);
};

export const useDispute = (id: string) => {
  const query = useQuery({
    queryKey: ["dispute", id],
    queryFn: async () => {
      const d = await disputeService.getDispute(id);
      const [invoice, customer, users, sla] = await Promise.all([
        invoiceService.getInvoiceDetails(d.invoice_id).catch(() => undefined),
        customerService.getCustomerDetail(d.customer_id).catch(() => undefined),
        userService.listUsers().catch(() => []),
        disputeService.getSLA(d.id).catch(() => undefined),
      ]);

      const usersMap = new Map(users.map((u: any) => [u.id, u]));
      const assoc = d.assigned_to ? usersMap.get(d.assigned_to) : null;
      const mgr = d.manager_id ? usersMap.get(d.manager_id) : null;

      return {
        ...d,
        invoice,
        customer: customer?.customer,
        assigned_user_name: assoc ? `${assoc.first_name} ${assoc.last_name}` : d.assigned_to ? "Finance Associate" : "Unassigned",
        manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
        sla,
      } as Dispute;
    },
    enabled: !!id,
  });
  return query;
};

export const useCases = (params?: CaseListParams) => {
  const query = useQuery({
    queryKey: ["disputeCases", params],
    queryFn: async () => {
      const casesPage = await disputeService.getCases(params);
      // Fetch disputes count/list to enrich if needed
      const disputesPage = await disputeService.getDisputes({ limit: 500 });
      const caseCounts = new Map<string, number>();
      disputesPage.items.forEach((d) => {
        caseCounts.set(d.case_id, (caseCounts.get(d.case_id) || 0) + 1);
      });

      return {
        items: casesPage.items.map((c) => ({
          ...c,
          dispute_count: caseCounts.get(c.id) || 0,
        })) as DisputeCase[],
        total: casesPage.total,
      };
    },
    ...listQueryOptions,
  });
  return query;
};

export const useCase = (id: string) => {
  const query = useQuery({
    queryKey: ["disputeCase", id],
    queryFn: async () => {
      const c = await disputeService.getCase(id);
      const disputes = await disputeService.getCaseDisputes(id);

      // Enrich disputes inside case details
      const [invoicesPage, customersPage, users] = await Promise.all([
        invoiceService.getInvoices({ limit: 500 }).catch(() => ({ items: [], total: 0 })),
        customerService.getCustomers({ limit: 500 }).catch(() => ({ items: [], total: 0 })),
        userService.listUsers().catch(() => []),
      ]);

      const invoicesMap = new Map(invoicesPage.items.map((inv: any) => [inv.id, inv]));
      const customersMap = new Map(customersPage.items.map((cust: any) => [cust.id, cust]));
      const usersMap = new Map(users.map((u: any) => [u.id, u]));

      const enrichedDisputes = disputes.map((d) => {
        const invoice = invoicesMap.get(d.invoice_id);
        const customer = customersMap.get(d.customer_id);
        const assoc = d.assigned_to ? usersMap.get(d.assigned_to) : null;
        const mgr = d.manager_id ? usersMap.get(d.manager_id) : null;

        return {
          ...d,
          invoice,
          customer,
          assigned_user_name: assoc ? `${assoc.first_name} ${assoc.last_name}` : d.assigned_to ? "Finance Associate" : "Unassigned",
          manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
        };
      });

      return {
        ...c,
        disputes: enrichedDisputes,
        dispute_count: enrichedDisputes.length,
      } as DisputeCase;
    },
    enabled: !!id,
  });
  return query;
};

export const useReviewQueue = (status?: string) => {
  const query = useQuery({
    queryKey: ["disputeReviewQueue", status],
    queryFn: async () => {
      const items = await disputeService.getReviewQueue(status);
      const disputesPage = await disputeService.getDisputes({ limit: 500 });
      const disputesMap = new Map(disputesPage.items.map((d) => [d.id, d]));

      return items.map((item) => ({
        ...item,
        dispute: disputesMap.get(item.dispute_id),
      })) as DisputeReviewQueueItem[];
    },
  });
  return query;
};

export const useActivities = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeActivities", disputeId],
    queryFn: () => disputeService.getActivities(disputeId),
    enabled: !!disputeId,
  });
};

export const useComments = (disputeId: string) => {
  const query = useQuery({
    queryKey: ["disputeComments", disputeId],
    queryFn: async () => {
      const comments = await disputeService.getComments(disputeId);
      const users = await userService.listUsers().catch(() => []);
      const usersMap = new Map(users.map((u: any) => [u.id, u]));

      return comments.map((c) => {
        const creator = usersMap.get(c.created_by);
        return {
          ...c,
          created_by_name: creator ? `${creator.first_name} ${creator.last_name}` : "System User",
        };
      }) as DisputeComment[];
    },
    enabled: !!disputeId,
  });
  return query;
};

export const useRecommendations = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeRecommendations", disputeId],
    queryFn: () => disputeService.getRecommendations(disputeId),
    enabled: !!disputeId,
  });
};

export const useCommunications = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeCommunications", disputeId],
    queryFn: () => disputeService.getCommunications(disputeId),
    enabled: !!disputeId,
  });
};

export const useLatestCommunicationDraft = (
  disputeId: string,
  options?: { pollForInboundDraft?: boolean }
) => {
  return useQuery({
    queryKey: ["disputeCommunicationDraft", disputeId],
    queryFn: () => disputeService.getLatestCommunicationDraft(disputeId),
    enabled: !!disputeId,
    refetchInterval: (query) => {
      const draft = query.state.data;
      if (draft?.status === "GENERATING") return 3000;
      if (options?.pollForInboundDraft && !draft) return 3000;
      return false;
    },
  });
};

export const useDraftDisputeCommunication = (disputeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructions?: string) =>
      disputeService.draftCommunication(disputeId, instructions ? { instructions } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputeCommunications", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeCommunicationDraft", disputeId] });
    },
  });
};

export const useSendDisputeCommunication = (disputeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssociateCommunicationSendPayload) =>
      disputeService.sendCommunication(disputeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputeCommunications", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeCommunicationDraft", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeSLA", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["dispute", disputeId] });
      queryClient.invalidateQueries({ queryKey: ["caseAttachments"] });
    },
  });
};

export const useEvidence = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeEvidence", disputeId],
    queryFn: () => disputeService.getEvidence(disputeId),
    enabled: !!disputeId,
  });
};

export const useWorkflowContext = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeWorkflowContext", disputeId],
    queryFn: () => disputeService.getWorkflowContext(disputeId),
    enabled: !!disputeId,
  });
};

export const useSLA = (disputeId: string) => {
  return useQuery({
    queryKey: ["disputeSLA", disputeId],
    queryFn: () => disputeService.getSLA(disputeId),
    enabled: !!disputeId,
  });
};

// MUTATIONS

export const useResolveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      invoice_number,
      dispute_category,
      comments,
    }: {
      id: string;
      invoice_number: string;
      dispute_category: string;
      comments?: string;
    }) => disputeService.resolveReviewItem(id, { invoice_number, dispute_category, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputeReviewQueue"] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      disputeId,
      comment,
      comment_type,
    }: {
      disputeId: string;
      comment: string;
      comment_type?: string;
    }) => disputeService.createComment(disputeId, { comment, comment_type }),
    onMutate: async (newComment) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ["disputeComments", newComment.disputeId] });
      const previousComments = queryClient.getQueryData<DisputeComment[]>([
        "disputeComments",
        newComment.disputeId,
      ]);

      if (previousComments) {
        queryClient.setQueryData<DisputeComment[]>(
          ["disputeComments", newComment.disputeId],
          [
            ...previousComments,
            {
              id: "temp-id-" + Date.now(),
              dispute_id: newComment.disputeId,
              comment: newComment.comment,
              comment_type: (newComment.comment_type as any) || "INTERNAL",
              created_by: "current-user",
              created_at: new Date().toISOString(),
              created_by_name: "You (sending...)",
            },
          ]
        );
      }

      return { previousComments };
    },
    onError: (_err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["disputeComments", newComment.disputeId],
          context.previousComments
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.disputeId] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.disputeId] });
    },
  });
};

export const useAssociateDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comments,
      amended_invoice_json,
    }: {
      id: string;
      decision: string;
      comments?: string;
      amended_invoice_json?: Record<string, unknown>;
    }) =>
      disputeService.submitAssociateDecision(id, {
        decision,
        comments,
        amended_invoice_json,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeWorkflowContext", variables.id] });
    },
  });
};

export const usePaymentReviewDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comments,
    }: {
      id: string;
      decision: string;
      comments?: string;
    }) => disputeService.submitPaymentReviewDecision(id, { decision, comments }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeWorkflowContext", variables.id] });
    },
  });
};

export const useOperationalDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comments,
    }: {
      id: string;
      decision: string;
      comments?: string;
    }) => disputeService.submitOperationalDecision(id, { decision, comments }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeWorkflowContext", variables.id] });
    },
  });
};

export const useAssignDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disputeService.assignDispute(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
};

export const useEscalateDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      disputeService.escalateDispute(id, { comments }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.id] });
    },
  });
};

export const useReassignDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      disputeService.reassignDispute(id, assignedTo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
};

export const useCloseDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & DisputeClosePayload) =>
      disputeService.closeDispute(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["disputeComments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeActivities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeWorkflowContext", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["disputeSLA", variables.id] });
    },
  });
};
