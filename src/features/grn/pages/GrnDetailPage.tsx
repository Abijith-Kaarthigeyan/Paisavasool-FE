import React, { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useGrnDetails } from "../hooks/useGrns"
import { grnService } from "../services/grnService"
import { LinkGrnToPoDialog } from "../components/LinkGrnToPoDialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardPath } from "@/lib/navigation"
import {
  Calendar,
  ClipboardList,
  FileText,
  HelpCircle,
  Link2,
  Loader2,
  PackageCheck,
} from "lucide-react"
import type { GrnStatus } from "../types"

function grnStatusVariant(status: GrnStatus): "success" | "warning" | "destructive" | "outline" {
  if (status === "LINKED") return "success"
  if (status === "UNLINKED") return "warning"
  if (status === "FAILED") return "destructive"
  return "outline"
}

export const GrnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isOpeningSourcePdf, setIsOpeningSourcePdf] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const { data: grn, isLoading, error } = useGrnDetails(id)

  const handleOpenSourcePdf = () => {
    if (!grn?.id || !grn.has_source_pdf || isOpeningSourcePdf) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setIsOpeningSourcePdf(true)

    grnService
      .openSourcePdfInTab(
        previewTab,
        grn.id,
        grn.source_file_name ?? `GRN-${grn.grn_number}.pdf`
      )
      .catch((err) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }
        toast({
          title: "Could not open source PDF",
          description: "Failed to load the original goods receipt note PDF.",
          type: "error",
        })
        console.error(err)
      })
      .finally(() => {
        setIsOpeningSourcePdf(false)
      })
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !grn) {
    return (
      <div className="space-y-8">
        <PageBreadcrumb
          items={[
            { label: "Dashboard", to: getDashboardPath() },
            { label: "Receivables", to: "/invoices" },
            { label: "GRNs", to: "/grns" },
            { label: "Goods receipt note" },
          ]}
        />
        <EmptyState
          icon={<HelpCircle className="h-6 w-6 text-destructive" />}
          title="Goods receipt note not found"
          description="The requested goods receipt note details could not be loaded."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/grns")}>
              Back to GRNs
            </Button>
          }
        />
      </div>
    )
  }

  const items = grn.items ?? []

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Receivables", to: "/invoices" },
          { label: "GRNs", to: "/grns" },
          { label: `GRN ${grn.grn_number}` },
        ]}
      />

      <PageHeader
        title={`GRN ${grn.grn_number}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={grnStatusVariant(grn.status)} shape="pill">
              {grn.status}
            </Badge>
            {grn.has_source_pdf && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenSourcePdf}
                disabled={isOpeningSourcePdf}
              >
                {isOpeningSourcePdf ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                )}
                Source Pdf
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PackageCheck className="h-4 w-4 text-primary" aria-hidden />
              Goods receipt note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">GRN number</p>
                <p className="font-medium text-foreground">{grn.grn_number}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">GRN date</p>
                <p className="font-medium text-foreground">
                  {new Date(grn.grn_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 text-foreground">{grn.notes?.trim() || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Link2 className="h-4 w-4 text-primary" aria-hidden />
              Purchase order
            </CardTitle>
            {!grn.po_id && (
              <Button variant="secondary" size="sm" onClick={() => setLinkDialogOpen(true)}>
                <Link2 className="h-3.5 w-3.5" aria-hidden />
                Link to PO
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4 text-sm">
            {grn.po_id ? (
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground">Linked PO</p>
                  <Link
                    to={`/purchase-orders/${grn.po_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {grn.po_number ?? "View purchase order"}
                  </Link>
                </div>
                {grn.po_number && (
                  <div>
                    <p className="text-muted-foreground">PO number</p>
                    <p className="font-medium text-foreground">{grn.po_number}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-warning">
                  This GRN is not linked to a purchase order.
                </p>
                {grn.po_number && (
                  <div>
                    <p className="text-muted-foreground">Extracted PO number</p>
                    <p className="font-medium text-foreground">{grn.po_number}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
            Line items
            {items.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-normal">
                {items.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState
              title="No line items"
              description="No received line items were extracted for this GRN."
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-foreground">{item.description}</TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LinkGrnToPoDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        grn={grn}
      />
    </div>
  )
}

export default GrnDetailPage
