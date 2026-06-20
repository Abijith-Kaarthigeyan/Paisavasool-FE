import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAssignedCases } from "../hooks/useCollections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import {
  Search,
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
} from "lucide-react"
import {
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getBucketBadgeVariant,
} from "./OpenCasesPage"

export const AssignedCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cases = [], isLoading, isError, refetch } = useAssignedCases();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Sorting State
  const [sortField, setSortField] = useState<string>("opened_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        const matchesSearch =
          c.id.toLowerCase().includes(term) ||
          c.customer?.customer_name.toLowerCase().includes(term) ||
          c.invoice?.invoice_number.toLowerCase().includes(term);

        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesPriority = !priorityFilter || c.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
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
  }, [cases, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  // Paginated Subset
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  const handleRowClick = (id: string) => {
    navigate(`/collections/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            My Assigned Cases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage collection cases assigned to your profile.
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
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, customer name, or invoice..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs text-foreground bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground w-full sm:w-36"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="PROMISED">PROMISED</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="DISPUTED">DISPUTED</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground w-full sm:w-36"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <FolderOpen className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Assigned Cases</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to retrieve your assigned collections. Please reload the dashboard.
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
              <FolderOpen className="h-10 w-10 text-slate-350 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No collection cases are currently assigned to your account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort("invoice_number")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        Invoice Number <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort("customer_name")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        Customer <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSort("outstanding_amount")}
                        className="flex items-center justify-end gap-1 hover:text-foreground text-[10px] font-bold w-full"
                      >
                        Outstanding <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-center">Bucket</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSort("opened_at")}
                        className="flex items-center justify-end gap-1 hover:text-foreground text-[10px] font-bold w-full"
                      >
                        Opened At <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCases.map((c) => {
                    const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleRowClick(c.id)}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {c.invoice?.invoice_number || "INV-N/A"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-semibold truncate max-w-[180px]">
                          {c.customer?.customer_name || "Active Client"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                          ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getBucketBadgeVariant(c.aging_bucket)} className="text-[10px] py-0 px-2 uppercase font-bold">
                            {c.aging_bucket}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getPriorityBadgeVariant(c.priority)} className="text-[10px] py-0 px-2 uppercase font-bold">
                            {c.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getStatusBadgeVariant(c.status)} className="text-[10px] py-0.5 px-2.5 uppercase font-bold">
                            {c.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                          {new Date(c.opened_at).toLocaleDateString()}
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
    </div>
  );
};

export default AssignedCasesPage;
