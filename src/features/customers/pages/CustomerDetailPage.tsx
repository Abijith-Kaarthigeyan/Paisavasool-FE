import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useCustomerDetail } from "../hooks/useCustomers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CREDIT_STATUS_VARIANT,
  CUSTOMER_PAYMENT_STATUS_VARIANT,
  INVOICE_STATUS_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  User,
  HelpCircle,
  FileText,
  CreditCard,
  Coins,
  Copy,
  ExternalLink,
} from "lucide-react"

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    data: customerDetail,
    isLoading,
    isError,
  } = useCustomerDetail(id)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard successfully.`,
      type: "success",
    })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Card className="h-48 w-full" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !customerDetail) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <EmptyState
          icon={<HelpCircle className="h-6 w-6 text-destructive" />}
          title="Customer not found"
          description="The requested customer details could not be loaded."
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>
              Back to customers
            </Button>
          }
        />
      </div>
    )
  }

  const { customer, aliases, invoices, payments, credits } = customerDetail

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Customers", to: "/customers" },
          { label: customer.customer_name },
        ]}
      />

      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {customer.customer_name}
          </h1>
          <Badge variant="outline" className="font-mono text-xs font-medium text-primary">
            {customer.customer_code}
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader className="mb-4 border-b border-border bg-muted/50 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <User className="h-4 w-4 text-primary" aria-hidden />
            Corporate client information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 pt-0 text-sm md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Email address</span>
              <span className="font-medium text-foreground">{customer.email || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Contact phone</span>
              <span className="font-medium text-foreground">{customer.phone || "N/A"}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-xs text-muted-foreground">Billing address</span>
              <span className="mt-1 rounded-md border border-border bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground">
                {customer.billing_address || "No address on file."}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="mb-1.5 text-xs text-muted-foreground">Registered payment aliases</span>
              {aliases.length === 0 ? (
                <span className="rounded-md border border-dashed border-border bg-muted/50 p-2.5 text-xs font-medium text-muted-foreground">
                  No alias patterns mapped. Payments must match customer name directly.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-muted/50 p-2.5">
                  {aliases.map((alias, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] font-medium uppercase">
                      {alias}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="invoices" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" aria-hidden />
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-1.5">
            <Coins className="h-4 w-4" aria-hidden />
            Credits ({credits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <EmptyState
                  title="No invoices"
                  description="No invoices are registered for this customer."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice number</TableHead>
                      <TableHead>Invoice date</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-center">Total amount</TableHead>
                      <TableHead className="text-center">Outstanding</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-foreground">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(inv.invoice_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums text-foreground">
                          {formatCurrency(inv.total_amount)}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {formatCurrency(inv.outstanding_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={getStatusVariant(INVOICE_STATUS_VARIANT, inv.status)}
                            shape="pill"
                          >
                            {inv.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Details <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <EmptyState
                  title="No payments"
                  description="No payment histories are linked to this customer."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment reference</TableHead>
                      <TableHead>Payment date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((pmt) => (
                      <TableRow key={pmt.id}>
                        <TableCell className="font-medium text-foreground">
                          {pmt.payment_reference || "Direct deposit"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(pmt.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(pmt.payment_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={getStatusVariant(CUSTOMER_PAYMENT_STATUS_VARIANT, pmt.status)}
                            shape="pill"
                          >
                            {pmt.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            to={`/payment-upload/${pmt.payment_upload_id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            View matches <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardContent className="p-0">
              {credits.length === 0 ? (
                <EmptyState
                  title="No credits"
                  description="No credit allocations reside on this account."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin payment ID</TableHead>
                      <TableHead>Created date</TableHead>
                      <TableHead className="text-right">Credit amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((crd) => (
                      <TableRow key={crd.id}>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={crd.payment_id}
                              readOnly
                              className="w-28 border-0 bg-transparent p-0 text-xs tracking-widest text-muted-foreground select-none focus:outline-hidden focus:ring-0"
                              aria-label="Masked payment ID"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => copyToClipboard(crd.payment_id, "Payment UUID")}
                              title="Copy raw payment ID"
                            >
                              <Copy className="h-3 w-3" aria-hidden />
                              Copy
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(crd.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(crd.credit_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={getStatusVariant(CREDIT_STATUS_VARIANT, crd.status)}
                            shape="pill"
                          >
                            {crd.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CustomerDetailPage
