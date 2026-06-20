import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useBrokenPromises, usePromises } from "../hooks/useCollections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import {
  Search,
  RefreshCw,
  HeartOff,
  AlertCircle,
} from "lucide-react"

export const BrokenPromisesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cases = [], isLoading: isLoadingCases, isError: isCasesError, refetch: refetchCases } = useBrokenPromises();
  const { data: promises = [], isLoading: isLoadingPromises, isError: isPromisesError, refetch: refetchPromises } = usePromises();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleRetry = () => {
    refetchCases();
    refetchPromises();
  };

  const isLoading = isLoadingCases || isLoadingPromises;
  const isError = isCasesError || isPromisesError;

  // Join case with its active broken promise
  const enrichedBrokenCases = useMemo(() => {
    if (!cases.length) return [];

    const brokenPromisesMap = new Map(
      promises
        .filter((p) => p.status === "BROKEN")
        .map((p) => [p.collection_case_id, p])
    );

    return cases.map((c) => {
      const activeBrokenPromise = brokenPromisesMap.get(c.id);
      
      let daysOverdue = 0;
      if (activeBrokenPromise?.promised_date) {
        const promiseTime = new Date(activeBrokenPromise.promised_date).getTime();
        const diffTime = Date.now() - promiseTime;
        daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }

      return {
        ...c,
        brokenPromise: activeBrokenPromise,
        daysOverdue,
      };
    })
    // Default Sort: Most overdue first (daysOverdue desc, then promise date asc)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [cases, promises]);

  // Filter & Search Logic
  const filteredCases = useMemo(() => {
    return enrichedBrokenCases.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        c.customer?.customer_name.toLowerCase().includes(term) ||
        c.invoice?.invoice_number.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      );
    });
  }, [enrichedBrokenCases, searchTerm]);

  // Paginated Subset
  const totalItems = filteredCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Broken Commitments (Promises to Pay)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track collection cases where customers breached payment promise dates. High priority queue.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </header>

      {/* Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-400">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <HeartOff className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-rose-500/70 block">
                Total Breached Promises
              </span>
              <span className="text-2xl font-bold font-mono">
                {isLoading ? "..." : enrichedBrokenCases.length} Cases
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-500/70 block">
                Average Overdue Days
              </span>
              <span className="text-2xl font-bold font-mono">
                {isLoading
                  ? "..."
                  : enrichedBrokenCases.length > 0
                  ? (
                      enrichedBrokenCases.reduce((sum, c) => sum + c.daysOverdue, 0) /
                      enrichedBrokenCases.length
                    ).toFixed(1)
                  : "0.0"}{" "}
                Days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-500/5 border-slate-500/20 text-slate-800 dark:text-slate-400">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="p-2.5 rounded-lg bg-slate-500/10 text-slate-500">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500/70 block">
                Outstanding at Risk
              </span>
              <span className="text-2xl font-bold font-mono">
                ₹
                {isLoading
                  ? "..."
                  : enrichedBrokenCases
                      .reduce((sum, c) => sum + (c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot), 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name or invoice number..."
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

      {/* Main Table */}
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
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Broken Commitments</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                An error occurred while fetching the broken promises registry.
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Retry Fetch
              </button>
            </div>
          ) : paginatedCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <HeartOff className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No active collection cases have broken promises. Good job!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4 text-right">Outstanding Amount</th>
                    <th className="py-3 px-4 text-center">Promise Date</th>
                    <th className="py-3 px-4 text-center">Days Overdue</th>
                    <th className="py-3 px-4">Assigned Associate</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCases.map((c) => {
                    const outstanding = c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/collections/${c.id}`)}
                        className="hover:bg-rose-500/5 dark:hover:bg-rose-950/10 cursor-pointer transition-colors border-l-2 border-l-transparent hover:border-l-rose-500"
                      >
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {c.customer?.customer_name || "Active Account"}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                          {c.invoice?.invoice_number || "INV-N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                          ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {c.brokenPromise?.promised_date
                            ? new Date(c.brokenPromise.promised_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
                            {c.daysOverdue} Days
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-semibold text-xs">
                          {c.assigned_associate_name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="destructive" className="text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider">
                            {c.status}
                          </Badge>
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

export default BrokenPromisesPage;
