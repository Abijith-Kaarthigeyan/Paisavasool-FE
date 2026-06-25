import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useReviewQueue, useResolveReview } from "../hooks/useDisputes"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { HelpCircle, RefreshCw, CheckCircle, ArrowRight } from "lucide-react"

// Zod Validation Schema
const resolveSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  dispute_category: z.string().min(1, "Category is required"),
  comments: z.string().min(3, "Please write at least a brief explanation"),
});

type ResolveFormValues = z.infer<typeof resolveSchema>;

export const ReviewQueuePage: React.FC = () => {
  const { toast } = useToast();
  const { data: items = [], isLoading, isError, refetch } = useReviewQueue("PENDING");
  const resolveMutation = useResolveReview();

  // Resolve dialog states
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
  });

  const handleOpenResolve = (item: any) => {
    setSelectedItem(item);
    reset({
      invoice_number: item.dispute?.invoice_number || "",
      dispute_category: item.dispute?.dispute_category || "",
      comments: "",
    });
  };

  const onSubmit = async (values: ResolveFormValues) => {
    if (!selectedItem) return;

    try {
      await resolveMutation.mutateAsync({
        id: selectedItem.id,
        invoice_number: values.invoice_number,
        dispute_category: values.dispute_category,
        comments: values.comments,
      });

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been resolved from review queue and resumed.",
        type: "success",
      });

      setSelectedItem(null);
    } catch (err) {
      toast({
        title: "Resolution Failed",
        description: "An error occurred while resolving the review queue item.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Dispute Review Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review triage classifications where AI confidence score is below threshold and manually assign categories to resume workflow execution.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </header>

      {/* Roster List */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Review Queue</h3>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">
                All disputes resolved! Review queue is empty.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Review Reason</th>
                    <th className="py-3 px-4">Suggested Category</th>
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4 text-center">AI Confidence</th>
                    <th className="py-3 px-4 text-center">Created Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground max-w-[200px] truncate" title={item.review_reason}>
                        {item.review_reason}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground uppercase font-bold text-[10px]">
                        {item.dispute?.dispute_category || "UNKNOWN"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.dispute?.invoice_number || "INV-N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <Badge variant="warning" className="text-[10px] py-0 px-2 font-bold font-mono">
                          {(0.68 * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenResolve(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"
                        >
                          Resolve Review <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog Form */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resolve Dispute Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Invoice Number
              </label>
              <input
                type="text"
                {...register("invoice_number")}
                className="w-full rounded-md border border-input bg-background p-2 text-sm font-semibold text-foreground focus:outline-hidden"
                placeholder="INV-00000"
              />
              {errors.invoice_number && (
                <span className="text-[10px] text-destructive font-bold">{errors.invoice_number.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Select Triage Category
              </label>
              <select
                {...register("dispute_category")}
                className="w-full rounded-md border border-input bg-background p-2 text-sm font-semibold text-foreground focus:outline-hidden"
              >
                <option value="">Select category...</option>
                <option value="SHORT_PAYMENT">Short Payment</option>
                <option value="PRICING_DISCREPANCY">Pricing Discrepancy</option>
                <option value="TAX_DISCREPANCY">Tax Discrepancy</option>
                <option value="RETURNS_EXCHANGES">Returns & Exchanges</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.dispute_category && (
                <span className="text-[10px] text-destructive font-bold">{errors.dispute_category.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Reason / Action Notes
              </label>
              <textarea
                {...register("comments")}
                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:outline-hidden min-h-[80px]"
                placeholder="Explain the validation override reasoning..."
              />
              {errors.comments && (
                <span className="text-[10px] text-destructive font-bold">{errors.comments.message}</span>
              )}
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                Confirm & Resume
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewQueuePage;
