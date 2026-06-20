import React, { useState, useMemo } from "react"
import { useReminderHistory } from "../hooks/useCollections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { Search, RefreshCw, Mail, ArrowUpDown } from "lucide-react"

const getReminderStatusVariant = (status: string) => {
  switch (status) {
    case "SENT": return "success";
    case "PENDING": return "default";
    case "FAILED": return "destructive";
    case "CANCELLED": return "outline";
    default: return "outline";
  }
};

export const ReminderHistoryPage: React.FC = () => {
  const { data: reminders = [], isLoading, isError, refetch } = useReminderHistory();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          r.subject.toLowerCase().includes(term) ||
          r.sent_to.toLowerCase().includes(term) ||
          r.body.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term);

        const matchesStatus = !statusFilter || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [reminders, searchTerm, statusFilter, sortDirection]);

  // Paginated Subset
  const totalItems = filteredReminders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReminders = filteredReminders.slice(startIndex, startIndex + itemsPerPage);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Reminder History Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse corporate communication dispatches, check dunning letters status, and view alert subject lines.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh History
        </button>
      </header>

      {/* Filters */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2 border border-input rounded-lg bg-background px-3 py-1.5 w-full max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by subject, email, or content..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs text-foreground bg-transparent focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:outline-hidden text-foreground w-full sm:w-44"
          >
            <option value="">All Statuses</option>
            <option value="SENT">SENT</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
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
              <Mail className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Reminder Logs</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to retrieve the dunning reminder histories from the backend server.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                Retry Fetch
              </button>
            </div>
          ) : paginatedReminders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Mail className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                No reminders have been generated or scheduled yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Sent To</th>
                    <th className="py-3 px-4 text-center">Reminder #</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        onClick={toggleSortDirection}
                        className="flex items-center justify-end gap-1 hover:text-foreground text-[10px] font-bold w-full"
                      >
                        Generated Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedReminders.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                      <td className="py-3 px-4 font-semibold text-foreground truncate max-w-[250px]" title={r.subject}>
                        {r.subject}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-semibold font-mono text-xs truncate max-w-[180px]">
                        {r.sent_to}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs font-semibold">
                        #{r.reminder_number}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getReminderStatusVariant(r.status)} className="text-[10px] py-0 px-2 uppercase font-bold">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
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

export default ReminderHistoryPage;
