import React from "react"
import { useParams, Link } from "react-router-dom"
import { useInvoiceDetails, useInvoiceItems } from "../hooks/useInvoices"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  HelpCircle,
  FileSpreadsheet
} from "lucide-react"

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch invoice details
  const { data: invoice, isLoading: isDetailsLoading, error: detailsError } = useInvoiceDetails(id);

  // Fetch invoice items
  const { data: items = [], isLoading: isItemsLoading } = useInvoiceItems(id);

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return "outline";
    switch (status) {
      case "PAID": return "success";
      case "PARTIALLY_PAID": return "info";
      case "PENDING": return "default";
      case "OVERDUE": return "destructive";
      case "DISPUTED": return "warning";
      default: return "outline";
    }
  };

  if (isDetailsLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detailsError || !invoice) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Invoice Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested invoice details could not be loaded.</p>
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/invoices" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Invoice #{invoice.invoice_number}
            </h1>
          </div>
        </div>
        <div>
          <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs uppercase px-3 py-1 font-bold tracking-wider">
            {invoice.status}
          </Badge>
        </div>
      </header>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Info Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Invoice Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span className="font-semibold text-foreground">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-semibold text-foreground">{new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-semibold text-foreground text-xs">AI Ingested Batch</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Customer Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3 text-sm">
            {invoice.customer ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold text-foreground">{invoice.customer.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Code:</span>
                  <span className="font-semibold text-foreground font-mono text-xs">{invoice.customer.customer_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground font-mono text-xs">{invoice.customer.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground text-xs">{invoice.customer.phone || "N/A"}</span>
                </div>
                <div className="flex flex-col border-t border-border pt-2.5 mt-2.5">
                  <span className="text-xs text-muted-foreground">Billing Address:</span>
                  <span className="font-medium text-foreground text-[11px] leading-relaxed mt-1">{invoice.customer.billing_address || "N/A"}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Active Billing Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Currency:</span>
                  <span className="font-semibold text-foreground">{invoice.currency}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice items table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Extracted Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isItemsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">No line items extracted.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-3 font-medium text-foreground">{item.description}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">
                        {invoice.currency} {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground font-mono">
                        {invoice.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals Section */}
          <div className="border-t border-border mt-6 pt-4 flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground font-mono">
                  {invoice.currency} {invoice.subtotal_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes:</span>
                <span className="font-semibold text-foreground font-mono">
                  {invoice.currency} {invoice.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="font-bold text-foreground">Total Invoice Amount:</span>
                <span className="font-bold text-foreground font-mono">
                  {invoice.currency} {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-rose-500">Remaining Balance (Outstanding):</span>
                <span className="font-bold text-rose-500 font-mono">
                  {invoice.currency} {invoice.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetailPage;
