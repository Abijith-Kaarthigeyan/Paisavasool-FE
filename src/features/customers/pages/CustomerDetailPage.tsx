import React from "react"
import { useParams, Link } from "react-router-dom"
import { useCustomerDetail } from "../hooks/useCustomers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { 
  ArrowLeft, 
  User, 
  HelpCircle,
  FileText,
  CreditCard,
  Coins,
  Copy,
  ExternalLink
} from "lucide-react"

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { 
    data: customerDetail, 
    isLoading, 
    isError 
  } = useCustomerDetail(id);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard successfully.`,
      type: "success",
    });
  };

  const getInvoiceStatusVariant = (status: string) => {
    switch (status) {
      case "PAID": return "success";
      case "PARTIALLY_PAID": return "default";
      case "PENDING": return "warning";
      case "OVERDUE": return "destructive";
      default: return "outline";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "SETTLED": return "success";
      case "PROCESSING": return "warning";
      case "REVIEW_REQUIRED": return "destructive";
      default: return "outline";
    }
  };

  const getCreditStatusVariant = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "success";
      case "USED": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Card className="h-48 w-full border-border shadow-xs" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="h-64 w-full border-border shadow-xs" />
      </div>
    );
  }

  if (isError || !customerDetail) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Customer Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested customer details could not be loaded.</p>
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, aliases, invoices, payments, credits } = customerDetail;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/customers" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              {customer.customer_name}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="font-mono text-xs text-primary font-bold">
              {customer.customer_code}
            </Badge>
          </div>
        </div>
      </header>

      {/* Profile Info Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border mb-4 bg-slate-50/50 dark:bg-zinc-900/10">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Corporate Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <span className="text-muted-foreground">Email Address:</span>
              <span className="font-semibold text-foreground">{customer.email || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <span className="text-muted-foreground">Contact Phone:</span>
              <span className="font-semibold text-foreground">{customer.phone || "N/A"}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-xs text-muted-foreground">Billing Address:</span>
              <span className="font-medium text-foreground text-[11px] leading-relaxed mt-1 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-md border border-border">
                {customer.billing_address || "No address on file."}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1.5">Registered Payment Aliases:</span>
              {aliases.length === 0 ? (
                <span className="text-xs text-muted-foreground font-semibold bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-md border border-dashed border-border">
                  No alias patterns mapped. Payments must match customer name directly.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-md border border-border">
                  {aliases.map((alias, idx) => (
                    <Badge key={idx} variant="secondary" className="font-semibold text-[10px] uppercase">
                      {alias}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Container */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-slate-100 dark:bg-zinc-900 border border-border">
          <TabsTrigger value="invoices" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-1.5">
            <Coins className="h-4 w-4" /> Credits ({credits.length})
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="border-border shadow-xs">
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-semibold text-xs">
                  No invoices are registered for this customer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                        <th className="py-3 px-4">Invoice Number</th>
                        <th className="py-3 px-4">Invoice Date</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4 text-right">Outstanding</th>
                        <th className="py-3 px-4 text-right">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">{inv.invoice_number}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(inv.invoice_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(inv.due_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={getInvoiceStatusVariant(inv.status)} className="text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link 
                              to={`/invoices/${inv.id}`}
                              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                            >
                              Details <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="border-border shadow-xs">
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-semibold text-xs">
                  No payment histories are linked to this customer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                        <th className="py-3 px-4">Payment Reference</th>
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {pmt.payment_reference || "Direct Deposit"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(pmt.payment_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            {pmt.currency} {pmt.payment_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={getPaymentStatusVariant(pmt.status)} className="text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider">
                              {pmt.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {/* Link to the payment details page using masked path */}
                            <Link 
                              to={`/payment-upload/${pmt.payment_upload_id}`}
                              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                            >
                              View Invoice Matches <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Credits Tab */}
        <TabsContent value="credits">
          <Card className="border-border shadow-xs">
            <CardContent className="p-0">
              {credits.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-semibold text-xs">
                  No credit allocations reside on this account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                        <th className="py-3 px-4">Origin Payment ID</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Credit Amount</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {credits.map((crd) => (
                        <tr key={crd.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {/* UUID Masking - Displays password inputs to prevent direct UUID rendering */}
                              <input 
                                type="password" 
                                value={crd.payment_id} 
                                readOnly 
                                className="bg-transparent border-0 p-0 text-xs w-28 tracking-widest text-slate-400 select-none focus:ring-0 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(crd.payment_id, "Payment UUID")}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1 px-2 rounded-md transition-colors"
                                title="Copy raw payment ID secure value"
                              >
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(crd.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            INR {crd.credit_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={getCreditStatusVariant(crd.status)} className="text-[10px] py-0.5 px-2 uppercase font-bold tracking-wider">
                              {crd.status}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetailPage;
