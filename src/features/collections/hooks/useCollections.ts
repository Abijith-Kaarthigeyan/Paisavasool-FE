import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { useMemo } from "react"
import { RootState } from "@/app/store"
import { collectionService } from "../services/collectionService"
import { analyticsService } from "../services/analyticsService"
import { invoiceService } from "@/features/invoices/services/invoiceService"
import { customerService } from "@/features/customers/services/customerService"
import { userService } from "@/features/users/services/userService"
import { CollectionCase } from "../types"

// Helper function to enrich collection cases with invoices, customers, and users data
const useEnrichedCases = (
  cases: CollectionCase[] | undefined,
  isLoadingCases: boolean
) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isPrivilegedUser = user?.role === "FINANCE_MANAGER" || user?.role === "ADMIN";

  // Fetch invoices, customers, and users lists in parallel
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
    staleTime: 5 * 60 * 1000,
  });

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
    staleTime: 5 * 60 * 1000,
    enabled: isPrivilegedUser,
  });

  const enrichedData = useMemo(() => {
    if (!cases) return [];

    const invoicesMap = new Map(invoicesQuery.data?.map((i) => [i.id, i]) || []);
    const customersMap = new Map(customersQuery.data?.map((c) => [c.id, c]) || []);
    const usersMap = new Map(usersQuery.data?.map((u) => [u.id, u]) || []);

    return cases.map((c) => {
      const invoice = invoicesMap.get(c.invoice_id);
      const customer = customersMap.get(c.customer_id);
      const assoc = c.assigned_to ? usersMap.get(c.assigned_to) : null;
      const mgr = c.manager_id ? usersMap.get(c.manager_id) : null;
      const escMgr = c.escalated_to_manager_id ? usersMap.get(c.escalated_to_manager_id) : null;

      return {
        ...c,
        invoice: invoice
          ? {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              total_amount: invoice.total_amount,
              outstanding_amount: invoice.outstanding_amount,
              due_date: invoice.due_date,
              invoice_date: invoice.invoice_date,
              status: invoice.status,
            }
          : undefined,
        customer: customer || undefined,
        assigned_associate_name: assoc
          ? `${assoc.first_name} ${assoc.last_name}`
          : c.assigned_to
          ? "Finance Associate"
          : "Unassigned",
        manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
        escalated_manager_name: escMgr ? `${escMgr.first_name} ${escMgr.last_name}` : undefined,
      };
    });
  }, [cases, invoicesQuery.data, customersQuery.data, usersQuery.data]);

  return {
    data: enrichedData,
    isLoading:
      isLoadingCases ||
      invoicesQuery.isLoading ||
      customersQuery.isLoading ||
      (isPrivilegedUser && usersQuery.isLoading),
    isError:
      invoicesQuery.isError ||
      customersQuery.isError ||
      (isPrivilegedUser && usersQuery.isError),
    refetch: invoicesQuery.refetch,
  };
};

export const useCollections = () => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["collectionCases"],
    queryFn: collectionService.getCollections,
  });

  return useEnrichedCases(cases, isLoading);
};

export const useOpenCollections = () => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["openCollectionCases"],
    queryFn: collectionService.getOpenCollections,
  });

  return useEnrichedCases(cases, isLoading);
};

export const useCollectionCase = (id: string) => {
  const query = useQuery({
    queryKey: ["collectionCase", id],
    queryFn: async () => {
      const caseData = await collectionService.getCollectionById(id);
      
      // Fetch details in parallel
      const [invoice, customer, users] = await Promise.all([
        invoiceService.getInvoiceDetails(caseData.invoice_id).catch(() => undefined),
        customerService.getCustomerDetail(caseData.customer_id).catch(() => undefined),
        userService.listUsers().catch(() => []), // managers only, otherwise default to empty
      ]);

      const usersMap = new Map(users.map((u: any) => [u.id, u]));
      const assoc = caseData.assigned_to ? usersMap.get(caseData.assigned_to) : null;
      const mgr = caseData.manager_id ? usersMap.get(caseData.manager_id) : null;
      const escMgr = caseData.escalated_to_manager_id ? usersMap.get(caseData.escalated_to_manager_id) : null;

      return {
        ...caseData,
        invoice,
        customer: customer?.customer,
        assigned_associate_name: assoc
          ? `${assoc.first_name} ${assoc.last_name}`
          : caseData.assigned_to
          ? "Finance Associate"
          : "Unassigned",
        manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
        escalated_manager_name: escMgr ? `${escMgr.first_name} ${escMgr.last_name}` : undefined,
      };
    },
    enabled: !!id,
  });
  return query;
};

export const useAssignedCases = () => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["assignedCases"],
    queryFn: collectionService.getMyCollections,
  });

  return useEnrichedCases(cases, isLoading);
};

export const useEscalatedCases = () => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["escalatedCases"],
    queryFn: collectionService.getEscalatedCollections,
  });

  return useEnrichedCases(cases, isLoading);
};

export const useBrokenPromises = () => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["brokenPromisesCases"],
    queryFn: collectionService.getBrokenPromises,
  });

  return useEnrichedCases(cases, isLoading);
};

export const usePromises = () => {
  const { data: promises, isLoading, isError, refetch } = useQuery({
    queryKey: ["promises"],
    queryFn: collectionService.getPromises,
  });

  return { data: promises, isLoading, isError, refetch };
};

export const useReminderHistory = () => {
  const { data: reminders, isLoading, isError, refetch } = useQuery({
    queryKey: ["reminderHistory"],
    queryFn: collectionService.getReminderHistory,
  });

  return { data: reminders, isLoading, isError, refetch };
};

export const useCollectionAnalytics = () => {
  const query = useQuery({
    queryKey: ["collectionAnalytics"],
    queryFn: analyticsService.getCollectionAnalytics,
    staleTime: 60000,
  });
  return query;
};

export const useAgingAnalytics = () => {
  const query = useQuery({
    queryKey: ["agingAnalytics"],
    queryFn: analyticsService.getAgingAnalytics,
    staleTime: 60000,
  });
  return query;
};

// Mutations for Collection activities & operations

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      caseId,
      activityType,
      notes,
    }: {
      caseId: string;
      activityType: string;
      notes?: string;
    }) => collectionService.createActivity(caseId, activityType, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collectionCase", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["collectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["openCollectionCases"] });
    },
  });
};

export const useCreatePromise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      caseId,
      promisedDate,
    }: {
      caseId: string;
      promisedDate: string;
    }) => collectionService.createPromise(caseId, promisedDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collectionCase", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["collectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["openCollectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["brokenPromisesCases"] });
      queryClient.invalidateQueries({ queryKey: ["collectionAnalytics"] });
    },
  });
};

export const useReassignCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, associateId }: { caseId: string; associateId: string }) =>
      collectionService.reassignCase(caseId, associateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collectionCase", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["collectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["openCollectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["assignedCases"] });
      queryClient.invalidateQueries({ queryKey: ["escalatedCases"] });
    },
  });
};

export const useCloseCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => collectionService.closeCase(caseId),
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({ queryKey: ["collectionCase", caseId] });
      queryClient.invalidateQueries({ queryKey: ["collectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["openCollectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["assignedCases"] });
      queryClient.invalidateQueries({ queryKey: ["escalatedCases"] });
      queryClient.invalidateQueries({ queryKey: ["collectionAnalytics"] });
    },
  });
};

export const useOverrideStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, newStatus }: { caseId: string; newStatus: string }) =>
      collectionService.overrideStatus(caseId, newStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collectionCase", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["collectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["openCollectionCases"] });
      queryClient.invalidateQueries({ queryKey: ["assignedCases"] });
      queryClient.invalidateQueries({ queryKey: ["escalatedCases"] });
    },
  });
};
