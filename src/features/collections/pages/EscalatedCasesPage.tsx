import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  useEscalatedCases,
  useReassignCase,
  useCloseCase,
  useOverrideStatus,
} from "../hooks/useCollections"
import { userService } from "@/features/users/services/userService"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  UserPlus,
  XCircle,
  Settings,
  Eye,
} from "lucide-react"
import {
  getBucketBadgeVariant,
} from "./OpenCasesPage"

export const EscalatedCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: cases = [], isLoading, isError, refetch } = useEscalatedCases();

  // User List Query (to allow reassigning)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  });

  const associates = useMemo(() => {
    return allUsers.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE" && u.is_active);
  }, [allUsers]);

  // Mutations
  const reassignMutation = useReassignCase();
  const closeMutation = useCloseCase();
  const overrideMutation = useOverrideStatus();

  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortField, setSortField] = useState<string>("escalated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Dialogs State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Form selections
  const [targetAssociateId, setTargetAssociateId] = useState("");
  const [targetStatus, setTargetStatus] = useState("");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Filter & Search Logic
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
          c.id.toLowerCase().includes(term) ||
          c.customer?.customer_name.toLowerCase().includes(term) ||
          c.invoice?.invoice_number.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        let aVal: any = a[sortField as keyof typeof a];
        let bVal: any = b[sortField as keyof typeof b];

        if (sortField === "invoice_number") {
          aVal = a.invoice?.invoice_number || "";
          bVal = b.invoice?.invoice_number || "";
        } else if (sortField === "customer_name") {
          aVal = a.customer?.customer_name || "";
          bVal = b.customer?.customer_name || "";
        } else if (sortField === "outstanding_amount") {
          aVal = a.invoice?.outstanding_amount || a.outstanding_amount_snapshot;
          bVal = b.invoice?.outstanding_amount || b.outstanding_amount_snapshot;
        }

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
      });
  }, [cases, searchTerm, sortField, sortDirection]);

  // Paginated Subset
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  // Reassign Action
  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !targetAssociateId) return;

    reassignMutation.mutate(
      { caseId: selectedCaseId, associateId: targetAssociateId },
      {
        onSuccess: () => {
          setIsReassignOpen(false);
          setSelectedCaseId(null);
          setTargetAssociateId("");
          toast({
            title: "Case Reassigned",
            description: "The case has been reassigned to the selected associate successfully.",
            type: "success",
          });
        },
        onError: () => {
          toast({
            title: "Reassignment Failed",
            description: "There was an error reassigning this case.",
            type: "error",
          });
        },
      }
    );
  };

  // Close Action
  const handleCloseSubmit = () => {
    if (!selectedCaseId) return;

    closeMutation.mutate(selectedCaseId, {
      onSuccess: () => {
        setIsCloseOpen(false);
        setSelectedCaseId(null);
        toast({
          title: "Case Closed",
          description: "The collection case has been manually closed.",
          type: "success",
        });
      },
      onError: () => {
        toast({
          title: "Failed to Close Case",
          description: "There was an error closing this case.",
          type: "error",
        });
      },
    });
  };

  // Override Status Action
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !targetStatus) return;

    overrideMutation.mutate(
      { caseId: selectedCaseId, newStatus: targetStatus },
      {
        onSuccess: () => {
          setIsOverrideOpen(false);
          setSelectedCaseId(null);
          setTargetStatus("");
          toast({
            title: "Status Overridden",
            description: "The collection status has been overridden successfully.",
            type: "success",
          });
        },
        onError: () => {
          toast({
            title: "Override Failed",
            description: "There was an error overriding the collection status.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Escalated Collection Cases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review cases requiring immediate manager intervention, status override, or workload reassignment.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </header>

      {/* Search and Filters Controls */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search escalated cases by customer name, invoice..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs text-foreground bg-transparent focus:outline-hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Table */}
      <Card className="border-border shadow-xs border-t-2 border-t-rose-500">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Escalated Cases</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ensure you have active manager permissions and the Accounts Receivable API is online.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Retry Fetch
              </button>
            </div>
          ) : paginatedCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-slate-355 mx-auto text-emerald-500" />
              <p className="text-sm text-muted-foreground font-semibold">
                No collection cases are currently in ESCALATED state. Excellent team efficiency!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort("customer_name")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        Customer <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-center">Bucket</th>
                    <th className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSort("escalated_at")}
                        className="flex items-center justify-center gap-1 hover:text-foreground text-[10px] font-bold w-full"
                      >
                        Escalated At <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Associate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCases.map((c) => {
                    const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot;
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-foreground truncate max-w-[150px]">
                          {c.customer?.customer_name || "Active Client"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-semibold">
                          {c.invoice?.invoice_number || "INV-N/A"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                          ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getBucketBadgeVariant(c.aging_bucket)} className="text-[10px] py-0 px-2 uppercase font-bold">
                            {c.aging_bucket}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-rose-600 dark:text-rose-450 font-bold font-mono">
                          {c.escalated_at
                            ? new Date(c.escalated_at).toLocaleString()
                            : new Date(c.updated_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-semibold">
                          {c.assigned_associate_name}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => navigate(`/collections/${c.id}`)}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-xs font-bold text-foreground transition-colors border border-border"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCaseId(c.id);
                                setTargetAssociateId(c.assigned_to || "");
                                setIsReassignOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-slate-105 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-xs font-bold text-primary transition-colors border border-border"
                              title="Reassign Case"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Reassign
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCaseId(c.id);
                                setTargetStatus(c.status);
                                setIsOverrideOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-slate-105 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 transition-colors border border-border"
                              title="Override Status"
                            >
                              <Settings className="h-3.5 w-3.5" /> Override
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCaseId(c.id);
                                setIsCloseOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-450 transition-colors border border-rose-250/20"
                              title="Close Case"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* REASSIGN DIALOG */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Collection Case</DialogTitle>
            <DialogDescription>
              Assign this escalated case to another active Finance Associate in the team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Select Associate
              </label>
              <select
                value={targetAssociateId}
                onChange={(e) => setTargetAssociateId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                required
              >
                <option value="">Choose Associate...</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setIsReassignOpen(false);
                  setSelectedCaseId(null);
                }}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reassignMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {reassignMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* OVERRIDE STATUS DIALOG */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Case Status</DialogTitle>
            <DialogDescription>
              Manually set the collections workflow status for this case. This will override automated triggers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                New Status Value
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                required
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PROMISED">PROMISED</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="DISPUTED">DISPUTED</option>
              </select>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setIsOverrideOpen(false);
                  setSelectedCaseId(null);
                }}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={overrideMutation.isPending}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {overrideMutation.isPending ? "Updating..." : "Override Status"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CLOSE CONFIRMATION DIALOG */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5" /> Close Collection Case
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this case manually? Closing indicates resolving all outstanding billing disputes or payment settlements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => {
                setIsCloseOpen(false);
                setSelectedCaseId(null);
              }}
              className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/85 transition-colors border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseSubmit}
              disabled={closeMutation.isPending}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {closeMutation.isPending ? "Closing..." : "Yes, Close Case"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscalatedCasesPage;
