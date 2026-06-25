import React, { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Dispute } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { SLAProgress } from "./SLAProgress"
import { Search, FolderOpen, ArrowUpDown, RefreshCw } from "lucide-react"

interface DisputesTableProps {
  disputes: Dispute[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  title: string;
  description: string;
}

export const DisputesTable: React.FC<DisputesTableProps> = ({
  disputes,
  isLoading,
  isError,
  refetch,
  title,
  description,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // Check query parameters (for Dashboard redirection filter matching)
  React.useEffect(() => {
    const slaParam = searchParams.get("sla");
    if (slaParam === "breached") {
      setStatusFilter(""); // Clear general status, we filter on breached
    }
  }, [searchParams]);

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

  // Get filter drop-down options from current data
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const invoices = new Set<string>();
    const customers = new Set<string>();
    const assignees = new Set<string>();

    disputes.forEach((d) => {
      if (d.dispute_category) categories.add(d.dispute_category);
      if (d.invoice_number) invoices.add(d.invoice_number);
      if (d.customer?.customer_name) customers.add(d.customer.customer_name);
      if (d.assigned_user_name) assignees.add(d.assigned_user_name);
    });

    return {
      categories: Array.from(categories).sort(),
      invoices: Array.from(invoices).sort(),
      customers: Array.from(customers).sort(),
      assignees: Array.from(assignees).sort(),
    };
  }, [disputes]);

  // Filter & Search Logic
  const filteredDisputes = useMemo(() => {
    const slaParam = searchParams.get("sla");
    const teamParam = searchParams.get("team");

    return disputes
      .filter((d) => {
        // Search Term (Dispute Number, Invoice Number, Customer name)
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          d.dispute_number.toLowerCase().includes(term) ||
          d.invoice_number.toLowerCase().includes(term) ||
          (d.customer?.customer_name || "").toLowerCase().includes(term);

        // Sidebar drop-downs
        const matchesStatus = !statusFilter || d.status === statusFilter;
        const matchesCategory = !categoryFilter || d.dispute_category === categoryFilter;
        const matchesInvoice = !invoiceFilter || d.invoice_number === invoiceFilter;
        const matchesCustomer = !customerFilter || d.customer?.customer_name === customerFilter;
        const matchesAssignee = !assigneeFilter || d.assigned_user_name === assigneeFilter;

        // Query parameters
        const matchesSlaParam = slaParam !== "breached" || d.sla?.status === "BREACHED";
        const matchesTeamParam = teamParam !== "true" || !!d.assigned_to; // represents team workloads

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesInvoice &&
          matchesCustomer &&
          matchesAssignee &&
          matchesSlaParam &&
          matchesTeamParam
        );
      })
      .sort((a, b) => {
        let aVal: any = a[sortField as keyof typeof a];
        let bVal: any = b[sortField as keyof typeof b];

        // Custom path sorting
        if (sortField === "sla_percentage") {
          aVal = a.sla?.current_percentage ?? 0;
          bVal = b.sla?.current_percentage ?? 0;
        }

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
  }, [
    disputes,
    searchTerm,
    statusFilter,
    categoryFilter,
    invoiceFilter,
    customerFilter,
    assigneeFilter,
    searchParams,
    sortField,
    sortDirection,
  ]);

  // Paginated Subset
  const totalItems = filteredDisputes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + itemsPerPage);

  const handleRowClick = (id: string) => {
    navigate(`/disputes/${id}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCategoryFilter("");
    setInvoiceFilter("");
    setCustomerFilter("");
    setAssigneeFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </header>

      {/* Filter Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Dispute ID, Invoice Number, or customer name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs text-foreground bg-transparent focus:outline-hidden"
              />
            </div>
            {(searchTerm || statusFilter || categoryFilter || invoiceFilter || customerFilter || assigneeFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-destructive hover:underline self-start md:self-center"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="WAITING_CUSTOMER">WAITING CUSTOMER</option>
                <option value="WAITING_INTERNAL">WAITING INTERNAL</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Invoice Number
              </label>
              <select
                value={invoiceFilter}
                onChange={(e) => {
                  setInvoiceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground"
              >
                <option value="">All Invoices</option>
                {filterOptions.invoices.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Customer
              </label>
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground"
              >
                <option value="">All Customers</option>
                {filterOptions.customers.map((cust) => (
                  <option key={cust} value={cust}>
                    {cust}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Assignee
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground"
              >
                <option value="">All Assignees</option>
                {filterOptions.assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Table */}
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
              <h3 className="text-base font-bold text-foreground">Failed to Load Disputes</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to retrieve disputes from server.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Retry
              </button>
            </div>
          ) : paginatedDisputes.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderOpen className="h-10 w-10 text-slate-350 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No active disputes match the filtered criteria.
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
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 w-[160px]">
                      <button
                        onClick={() => handleSort("sla_percentage")}
                        className="flex items-center gap-1 hover:text-foreground text-[10px] font-bold"
                      >
                        SLA Status <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Assigned To</th>
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
                  {paginatedDisputes.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => handleRowClick(d.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors text-xs"
                    >
                      <td className="py-3 px-4 font-semibold text-primary">
                        {d.dispute_number}
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {d.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground uppercase text-[10px] font-bold">
                        {d.dispute_category}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-[9px] py-0.5 px-2.5 uppercase font-bold">
                          {d.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            d.sla?.status === "BREACHED"
                              ? "destructive"
                              : d.sla?.status === "AT_RISK"
                              ? "warning"
                              : "default"
                          }
                          className="text-[9px] py-0 px-2 font-bold"
                        >
                          {d.sla?.status === "BREACHED" ? "HIGH" : d.sla?.status === "AT_RISK" ? "MEDIUM" : "LOW"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {d.sla ? (
                          <SLAProgress
                            percentage={d.sla.current_percentage}
                            isPaused={d.sla.is_paused}
                          />
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-semibold">No SLA SLA Mapped</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-semibold">
                        {d.assigned_user_name}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground font-medium">
                        {new Date(d.created_at).toLocaleDateString()}
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
