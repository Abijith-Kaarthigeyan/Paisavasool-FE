import React, { useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  useInvoiceDetails,
  useInvoiceItems,
  useInvoiceVersions,
  useInvoiceVersion,
} from "../hooks/useInvoices"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Calendar,
  User,
  HelpCircle,
  FileSpreadsheet,
  History,
} from "lucide-react"

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedVersion, setSelectedVersion] = useState<number | "current">("current");

  const { data: invoice, isLoading: isDetailsLoading, error: detailsError } = useInvoiceDetails(id);
  const { data: liveItems = [], isLoading: isItemsLoading } = useInvoiceItems(id);
  const { data: versions = [] } = useInvoiceVersions(id);

  const viewingHistorical =
    selectedVersion !== "current" && selectedVersion !== invoice?.current_version;

  const { data: historicalVersion, isLoading: isHistoricalLoading } = useInvoiceVersion(
    id,
    viewingHistorical ? (selectedVersion as number) : null
  );

  const displaySnapshot = useMemo(() => {
    if (!viewingHistorical || !historicalVersion) return null;
    return historicalVersion.invoice_snapshot;
  }, [viewingHistorical, historicalVersion]);

  const displayItems = useMemo(() => {
    if (viewingHistorical && historicalVersion) {
      return historicalVersion.items_snapshot.map((item, index) => ({
        id: `hist-${index}`,
        invoice_id: id || "",
        description: String(item.description ?? ""),
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        amount: Number(item.amount ?? 0),
        created_at: historicalVersion.created_at || "",
      }));
    }
    return liveItems;
  }, [viewingHistorical, historicalVersion, liveItems, id]);

  const headerInvoiceNumber = viewingHistorical
    ? String(displaySnapshot?.invoice_number ?? invoice?.invoice_number)
    : invoice?.invoice_number;

  const headerStatus = viewingHistorical
    ? String(displaySnapshot?.status ?? "HISTORICAL")
    : invoice?.status;

  const currency = viewingHistorical
    ? String(displaySnapshot?.currency ?? invoice?.currency ?? "INR")
    : invoice?.currency ?? "INR";

  const subtotal = viewingHistorical
    ? Number(displaySnapshot?.subtotal_amount ?? 0)
    : invoice?.subtotal_amount ?? 0;

  const tax = viewingHistorical
    ? Number(displaySnapshot?.tax_amount ?? 0)
    : invoice?.tax_amount ?? 0;

  const total = viewingHistorical
    ? Number(displaySnapshot?.total_amount ?? 0)
    : invoice?.total_amount ?? 0;

  const outstanding = viewingHistorical
    ? Number(displaySnapshot?.outstanding_amount ?? 0)
    : invoice?.outstanding_amount ?? 0;

  const invoiceDate = viewingHistorical
    ? String(displaySnapshot?.invoice_date ?? "")
    : invoice?.invoice_date ?? "";

  const dueDate = viewingHistorical
    ? String(displaySnapshot?.due_date ?? "")
    : invoice?.due_date ?? "";

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

  const currentVersion = invoice.current_version ?? 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/invoices" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Invoice #{headerInvoiceNumber}
            </h1>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <Badge variant="outline" className="text-[10px] uppercase">
              Version {viewingHistorical ? selectedVersion : currentVersion}
            </Badge>
            {viewingHistorical && (
              <span className="text-[10px] text-amber-600 font-semibold uppercase">
                Historical snapshot (read-only)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <select
              value={selectedVersion === "current" ? String(currentVersion) : String(selectedVersion)}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedVersion(val === currentVersion ? "current" : val);
              }}
              className="text-xs rounded-md border border-input bg-background px-2 py-1.5"
            >
              {versions.map((v) => (
                <option key={v.version_number} value={v.version_number}>
                  v{v.version_number}
                  {v.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
          )}
          <Badge variant={getStatusBadgeVariant(headerStatus)} className="text-xs uppercase px-3 py-1 font-bold tracking-wider">
            {headerStatus}
          </Badge>
        </div>
      </header>

      {versions.length > 1 && (
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Amendment History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase">
                    <th className="py-2 pr-3">Version</th>
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Reason</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">By</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr
                      key={v.version_number}
                      className="border-b border-border/60 hover:bg-slate-50/30 cursor-pointer"
                      onClick={() =>
                        setSelectedVersion(v.is_current ? "current" : v.version_number)
                      }
                    >
                      <td className="py-2 pr-3 font-mono font-bold">
                        v{v.version_number}
                        {v.is_current ? " *" : ""}
                      </td>
                      <td className="py-2 pr-3">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">{v.change_reason || "—"}</td>
                      <td className="py-2 pr-3">{v.change_source}</td>
                      <td className="py-2 pr-3">{v.created_by || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Invoice Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date:</span>
              <span className="font-semibold text-foreground">
                {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-semibold text-foreground">
                {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

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
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing Currency:</span>
                <span className="font-semibold text-foreground">{currency}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isItemsLoading || (viewingHistorical && isHistoricalLoading) ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">No line items.</div>
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
                  {displayItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20">
                      <td className="py-3 px-3 font-medium text-foreground">{item.description}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-mono">
                        {currency} {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground font-mono">
                        {currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-border mt-6 pt-4 flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground font-mono">
                  {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes:</span>
                <span className="font-semibold text-foreground font-mono">
                  {currency} {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="font-bold text-foreground">Total Invoice Amount:</span>
                <span className="font-bold text-foreground font-mono">
                  {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-rose-500">Outstanding:</span>
                <span className="font-bold text-rose-500 font-mono">
                  {currency} {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
