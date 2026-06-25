import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useDisputes, useReassignDispute } from "../hooks/useDisputes"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, FolderOpen, ArrowUpDown, RefreshCw, UserMinus } from "lucide-react"

export const EscalatedDisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes();
  const reassignMutation = useReassignDispute();

  // Reassignment state
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [selectedDisputeNum, setSelectedDisputeNum] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState("");

  // Fetch users for reassignment
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  });

  const associates = useMemo(() => {
    return users.filter((u) => u.role?.role_name === "FINANCE_ASSOCIATE");
  }, [users]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter escalated disputes (e.g. SLA is breached, or has active escalations)
  const escalatedDisputes = useMemo(() => {
    return disputes.filter(
      (d) => d.sla?.status === "BREACHED" && d.status !== "RESOLVED" && d.status !== "CLOSED"
    );
  }, [disputes]);

  const filteredEscalated = useMemo(() => {
    return escalatedDisputes
      .filter((d) => {
        const term = searchTerm.toLowerCase();
        return (
          d.dispute_number.toLowerCase().includes(term) ||
          (d.dispute_category || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        let aVal: any = a[sortField as keyof typeof a];
        let bVal: any = b[sortField as keyof typeof b];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "string") {
          const aString = aVal;
          const bString = String(bVal);
          return sortDirection === "asc"
            ? aString.localeCompare(bString)
            : bString.localeCompare(aString);
        } else {
          return sortDirection === "asc"
            ? aVal - bVal
            : bVal - aVal;
        }
      });
  }, [escalatedDisputes, searchTerm, sortField, sortDirection]);

  // Paginated Subset
  const totalItems = filteredEscalated.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEscalated = filteredEscalated.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleOpenReassign = (e: React.MouseEvent, id: string, num: string) => {
    e.stopPropagation();
    setSelectedDisputeId(id);
    setSelectedDisputeNum(num);
    setAssigneeId("");
  };

  const handleConfirmReassign = async () => {
    if (!selectedDisputeId || !assigneeId) return;

    try {
      await reassignMutation.mutateAsync({
        id: selectedDisputeId,
        assignedTo: assigneeId,
      });

      toast({
        title: "Dispute Reassigned",
        description: `Dispute ${selectedDisputeNum} reassigned successfully.`,
        type: "success",
      });

      setSelectedDisputeId(null);
      setSelectedDisputeNum(null);
    } catch (err) {
      toast({
        title: "Reassignment Failed",
        description: "An error occurred while reassigning the dispute.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Escalated Dispute Lifecycle Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Finance Manager view for overseeing SLA breaches, reassignment queues, and critical customer issues.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </header>

      {/* Search Filter */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Dispute Number, category..."
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

      {/* Grid table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <FolderOpen className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Escalated Queue</h3>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Retry
              </button>
            </div>
          ) : paginatedEscalated.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-slate-350 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No active escalated disputes or SLA breaches.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort("dispute_number")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        Dispute Number <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Escalation Level</th>
                    <th className="py-3 px-4">Manager Assignee</th>
                    <th className="py-3 px-4 text-center">SLA Status</th>
                    <th className="py-3 px-4 text-center">Escalated Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {paginatedEscalated.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/disputes/${d.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-primary">
                        {d.dispute_number}
                      </td>
                      <td className="py-3 px-4 text-foreground uppercase font-bold text-[10px]">
                        {d.dispute_category}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        Level 1
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-semibold">
                        {d.manager_name || "Finance Manager"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="destructive" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                          {d.sla?.status || "BREACHED"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground font-medium">
                        {d.sla?.paused_at ? new Date(d.sla.paused_at).toLocaleDateString() : new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={(e) => handleOpenReassign(e, d.id, d.dispute_number)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors"
                        >
                          <UserMinus className="h-3 w-3" /> Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Reassign Dialog */}
      <Dialog open={selectedDisputeId !== null} onOpenChange={(open) => !open && setSelectedDisputeId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reassign Dispute {selectedDisputeNum}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Finance Associate
              </label>
              {isUsersLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm font-semibold text-foreground focus:outline-hidden"
                >
                  <option value="">Choose associate...</option>
                  {associates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSelectedDisputeId(null)}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReassign}
              disabled={!assigneeId || reassignMutation.isPending}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
            >
              Confirm Reassign
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscalatedDisputesPage;
