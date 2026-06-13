import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useInvoices } from "../hooks/useInvoices"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { 
  Search, 
  RefreshCw, 
  HelpCircle,
  Inbox
} from "lucide-react"

export const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch invoices with offset/limit & filters
  const { 
    data: invoices = [], 
    isLoading, 
    isError, 
    refetch 
  } = useInvoices();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID": return "success";
      case "PARTIALLY_PAID": return "info";
      case "PENDING": return "default";
      case "OVERDUE": return "destructive";
      case "DISPUTED": return "warning";
      default: return "outline";
    }
  };

  const handleRowClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Filter local calculations
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === "") return true;
    return inv.status === statusFilter;
  });

  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const currencySymbol = invoices[0]?.currency || "INR";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Billing Register
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse corporate invoices, track outstanding balances, and check dispute indicators.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </header>

      {/* Filter and Content Controls */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-input bg-background p-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-hidden text-foreground w-full max-w-xs"
            >
              <option value="">All Invoices</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="DISPUTED">DISPUTED</option>
            </select>
          </div>
          <div className="text-xs text-muted-foreground self-end sm:self-center font-semibold">
            Total Open Balance: {currencySymbol} {filteredInvoices.reduce((sum, i) => sum + i.outstanding_amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices List Table */}
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
              <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Billing Invoices</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Verify the Accounts Receivable database backend service is active and responsive.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Fetch
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">No invoices match the selected status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleRowClick(inv.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                        {inv.customer?.customer_name || "Active Account"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant={getStatusBadgeVariant(inv.status)} className="text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider">
                          {inv.status}
                        </Badge>
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

export default InvoiceListPage;
