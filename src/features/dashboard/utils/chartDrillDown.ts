import type { AgingBucket } from "@/features/collections/types"

export const UNCLASSIFIED_DISPUTE_CATEGORY = "Unclassified"

export function getAgingBucketDrillDownPath(bucket: AgingBucket): string {
  return `/collections/open?bucket=${encodeURIComponent(bucket)}`
}

export function getDisputeCategoryDrillDownPath(categoryName: string): string {
  return `/disputes/all?category=${encodeURIComponent(categoryName)}`
}

export function isUnclassifiedDisputeCategory(category: string): boolean {
  return category === UNCLASSIFIED_DISPUTE_CATEGORY
}

export const AGING_CHART_BUCKETS: { name: string; bucket: AgingBucket }[] = [
  { name: "Current", bucket: "CURRENT" },
  { name: "0-30", bucket: "0-30" },
  { name: "31-60", bucket: "31-60" },
  { name: "61-90", bucket: "61-90" },
  { name: "90+", bucket: "90_PLUS" },
]
