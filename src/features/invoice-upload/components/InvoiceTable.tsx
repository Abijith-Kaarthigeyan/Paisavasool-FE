import React, { useState } from "react"
import { Invoice } from "../types/invoiceUpload.types"

interface InvoiceTableProps {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isLoading,
  isError,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Imported Invoices</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
          <div className="h-20 rounded bg-zinc-50 dark:bg-zinc-900/50 w-full" />
          <div className="h-20 rounded bg-zinc-50 dark:bg-zinc-900/50 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-rose-500 shadow-sm">
        Failed to load invoices list. Verify connection to the AR database service.
      </div>
    );
  }

  const list = invoices || [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = list.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
      case "PARTIALLY_PAID":
        return "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400";
      case "PENDING":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
      case "OVERDUE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
      case "DISPUTED":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      default:
        return "bg-zinc-50 text-zinc-700 dark:bg-zinc-950/20 dark:text-zinc-400";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground m-0">Successfully Imported Invoices</h3>
        <span className="text-xs text-muted-foreground">Showing {Math.min(totalItems, startIndex + 1)}-{Math.min(totalItems, startIndex + itemsPerPage)} of {totalItems}</span>
      </div>

      {totalItems === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No invoices imported yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                  <th className="py-3 px-2">Invoice Number</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Invoice Date</th>
                  <th className="py-3 px-2">Due Date</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Outstanding</th>
                  <th className="py-3 px-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-3 px-2 font-semibold text-foreground">{inv.invoice_number}</td>
                    <td className="py-3 px-2 text-xs text-muted-foreground font-semibold">
                      Active Customer
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="py-3 px-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground font-mono">
                      {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-foreground font-mono">
                      {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-border px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
