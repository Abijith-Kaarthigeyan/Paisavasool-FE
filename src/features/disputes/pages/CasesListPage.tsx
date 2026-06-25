import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useCases } from "../hooks/useDisputes"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { Search, RefreshCw, FolderOpen, ArrowUpDown } from "lucide-react"

export const CasesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cases = [], isLoading, isError, refetch } = useCases();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Sorting State
  const [sortField, setSortField] = useState<string>("created_at");
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
          c.case_number.toLowerCase().includes(term) ||
          c.customer_email.toLowerCase().includes(term) ||
          (c.email_subject || "").toLowerCase().includes(term);

        const matchesStatus = !statusFilter || c.status === statusFilter;

        return matchesSearch && matchesStatus;
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
  }, [cases, searchTerm, statusFilter, sortField, sortDirection]);

  // Paginated Subset
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  const handleRowClick = (id: string) => {
    navigate(`/disputes/cases/${id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Intake Email Cases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse email tickets ingested by the platform and review associated disputes created by AI analysis.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Cases
        </button>
      </header>

      {/* Filters */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Case Number, Customer Email, or Subject..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs text-foreground bg-transparent focus:outline-hidden"
              />
            </div>
            {(statusFilter || searchTerm) && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-destructive hover:underline self-start md:self-center"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
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
              <h3 className="text-base font-bold text-foreground">Failed to Load Cases</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to retrieve dispute cases list from database.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : paginatedCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No cases match the filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">
                      <button
                        onClick={() => handleSort("case_number")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        Case Number <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Customer Email</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Dispute Count</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center justify-end gap-1 hover:text-foreground text-[10px] font-bold w-full"
                      >
                        Created Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-primary">
                        {c.case_number}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-[200px]">
                        {c.customer_email}
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold truncate max-w-[250px]">
                        {c.email_subject || "(No Subject)"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                        {c.dispute_count}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={c.status === "OPEN" ? "default" : "outline"}
                          className="text-[10px] py-0 px-2 font-bold"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default CasesListPage;
