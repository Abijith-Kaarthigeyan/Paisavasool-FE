import React, { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useReviewQueue, useResolveReview } from "../hooks/useDisputes"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ConfidenceMeter } from "@/components/ui/confidence-meter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getConfidenceBadgeVariant } from "@/lib/design-tokens"
import { getReviewQueueDisplayConfidence } from "../utils/disputeFormatters"
import { HelpCircle, RefreshCw, CheckCircle, ArrowRight } from "lucide-react"

const resolveSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  dispute_category: z.string().min(1, "Category is required"),
  comments: z.string().min(3, "Please write at least a brief explanation"),
})

type ResolveFormValues = z.infer<typeof resolveSchema>

export const ReviewQueuePage: React.FC = () => {
  const { toast } = useToast()
  const { data: items = [], isLoading, isError, refetch } = useReviewQueue("PENDING")
  const resolveMutation = useResolveReview()

  const [selectedItem, setSelectedItem] = useState<(typeof items)[number] | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aConf = getReviewQueueDisplayConfidence(a)
      const bConf = getReviewQueueDisplayConfidence(b)
      return sortDirection === "asc" ? aConf - bConf : bConf - aConf
    })
  }, [items, sortDirection])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
  })

  const handleOpenResolve = (item: (typeof items)[number]) => {
    setSelectedItem(item)
    reset({
      invoice_number: item.dispute?.invoice_number || "",
      dispute_category: item.dispute?.dispute_category || "",
      comments: "",
    })
  }

  const onSubmit = async (values: ResolveFormValues) => {
    if (!selectedItem) return

    try {
      await resolveMutation.mutateAsync({
        id: selectedItem.id,
        invoice_number: values.invoice_number,
        dispute_category: values.dispute_category,
        comments: values.comments,
      })

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been resolved from review queue and resumed.",
        type: "success",
      })

      setSelectedItem(null)
    } catch {
      toast({
        title: "Resolution Failed",
        description: "An error occurred while resolving the review queue item.",
        type: "error",
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Dispute review queue"
        description="Review triage classifications where AI confidence is below threshold. Manually assign categories to resume workflow execution."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh queue
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load review queue"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : sortedItems.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-6 w-6 text-success" />}
              title="Queue is empty"
              description="All disputes have been resolved. No items need manual review."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review reason</TableHead>
                  <TableHead>Suggested category</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="w-44">
                    <button
                      type="button"
                      onClick={() =>
                        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                      }
                      aria-sort={sortDirection === "asc" ? "ascending" : "descending"}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      AI confidence
                    </button>
                  </TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const confidence = getReviewQueueDisplayConfidence(item)
                  return (
                    <TableRow key={item.id}>
                      <TableCell
                        className="max-w-[220px] truncate font-medium"
                        title={item.review_reason}
                      >
                        {item.review_reason}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.dispute?.dispute_category || "Unknown"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.dispute?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <Badge
                            variant={getConfidenceBadgeVariant(confidence)}
                            shape="pill"
                          >
                            Low confidence
                          </Badge>
                          <ConfidenceMeter
                            value={confidence}
                            showValue
                            size="sm"
                            label=""
                          />
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleOpenResolve(item)}
                        >
                          Resolve
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedItem !== null}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve dispute category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resolve-invoice">Invoice number</Label>
              <Input
                id="resolve-invoice"
                type="text"
                {...register("invoice_number")}
                placeholder="INV-00000"
              />
              {errors.invoice_number && (
                <p className="text-xs text-destructive">{errors.invoice_number.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resolve-category">Triage category</Label>
              <Select id="resolve-category" {...register("dispute_category")}>
                <option value="">Select category…</option>
                <option value="SHORT_PAYMENT">Short payment</option>
                <option value="PRICING_DISCREPANCY">Pricing discrepancy</option>
                <option value="TAX_DISCREPANCY">Tax discrepancy</option>
                <option value="RETURNS_EXCHANGES">Returns & exchanges</option>
                <option value="OTHER">Other</option>
              </Select>
              {errors.dispute_category && (
                <p className="text-xs text-destructive">{errors.dispute_category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resolve-comments">Reason / notes</Label>
              <textarea
                id="resolve-comments"
                {...register("comments")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
                placeholder="Explain the validation override reasoning…"
              />
              {errors.comments && (
                <p className="text-xs text-destructive">{errors.comments.message}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={resolveMutation.isPending}>
                Confirm & resume
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReviewQueuePage
