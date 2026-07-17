import { useState } from "react"
import { FileText, Loader2, ClipboardList, Package } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import type { GoodsReceiptNote } from "@/features/grn/types"
import { grnService } from "@/features/grn/services/grnService"
import {
  usePurchaseOrderDetails,
  usePurchaseOrderGrns,
} from "@/features/purchase-orders/hooks/usePurchaseOrders"
import { purchaseOrderService } from "@/features/purchase-orders/services/purchaseOrderService"
import { getInvoicePoContext } from "@/features/purchase-orders/utils/poInvoiceContext"
import type { Dispute } from "../../types"

interface DisputeSourceDocumentsTabProps {
  dispute: Dispute
}

export function DisputeSourceDocumentsTab({ dispute }: DisputeSourceDocumentsTabProps) {
  const { toast } = useToast()
  const poContext = getInvoicePoContext(dispute.invoice)
  const poId = poContext.poId ?? undefined

  const { data: purchaseOrder, isLoading: isLoadingPo } = usePurchaseOrderDetails(poId)
  const { data: grns = [], isLoading: isLoadingGrns } = usePurchaseOrderGrns(poId)

  const [isOpeningPoPdf, setIsOpeningPoPdf] = useState(false)
  const [openingPdfGrnId, setOpeningPdfGrnId] = useState<string | null>(null)

  const handleOpenPoPdf = () => {
    if (!purchaseOrder?.id || !purchaseOrder.has_source_pdf || isOpeningPoPdf) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setIsOpeningPoPdf(true)

    purchaseOrderService
      .openSourcePdfInTab(previewTab, purchaseOrder.id, `PO-${purchaseOrder.po_number}.pdf`)
      .catch((error) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }
        toast({
          title: "Could not open source PDF",
          description: "Failed to load the original purchase order PDF.",
          type: "error",
        })
        console.error(error)
      })
      .finally(() => {
        setIsOpeningPoPdf(false)
      })
  }

  const handleOpenGrnPdf = (grn: GoodsReceiptNote) => {
    if (!grn.has_source_pdf || openingPdfGrnId) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setOpeningPdfGrnId(grn.id)

    grnService
      .openSourcePdfInTab(
        previewTab,
        grn.id,
        grn.source_file_name ?? `GRN-${grn.grn_number}.pdf`
      )
      .catch((error) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }
        toast({
          title: "Could not open GRN PDF",
          description: "Failed to load the goods receipt note PDF.",
          type: "error",
        })
        console.error(error)
      })
      .finally(() => {
        setOpeningPdfGrnId(null)
      })
  }

  if (!poContext.hasLinkedPo || !poId) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6 text-muted-foreground" />}
        title="No source documents"
        description="Link a purchase order to this invoice to access original PO and GRN PDFs."
      />
    )
  }

  if (isLoadingPo || isLoadingGrns) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const hasAnyPdf =
    Boolean(purchaseOrder?.has_source_pdf) || grns.some((grn) => grn.has_source_pdf)

  if (!hasAnyPdf) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6 text-muted-foreground" />}
        title="No PDFs on file"
        description="The linked purchase order and GRNs do not have original source PDFs stored."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Source documents</CardTitle>
          <CardDescription>
            Original PDFs for the linked purchase order and goods receipt notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {purchaseOrder && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Purchase order PO-{purchaseOrder.po_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {purchaseOrder.has_source_pdf
                      ? `PO-${purchaseOrder.po_number}.pdf`
                      : "No PDF on file"}
                  </p>
                </div>
              </div>
              {purchaseOrder.has_source_pdf ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenPoPdf}
                  disabled={isOpeningPoPdf}
                >
                  {isOpeningPoPdf ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Open PDF
                </Button>
              ) : (
                <Badge variant="outline" shape="pill" className="text-[10px]">
                  No PDF
                </Badge>
              )}
            </div>
          )}

          {grns.map((grn) => {
            const isOpening = openingPdfGrnId === grn.id
            return (
              <div
                key={grn.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      GRN {grn.grn_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grn.has_source_pdf
                        ? grn.source_file_name ?? `GRN-${grn.grn_number}.pdf`
                        : "No PDF on file"}
                    </p>
                  </div>
                </div>
                {grn.has_source_pdf ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenGrnPdf(grn)}
                    disabled={Boolean(openingPdfGrnId)}
                  >
                    {isOpening ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Open PDF
                  </Button>
                ) : (
                  <Badge variant="outline" shape="pill" className="text-[10px]">
                    No PDF
                  </Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
