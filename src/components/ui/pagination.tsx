import React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
}

function getSummaryText(
  currentPage: number,
  totalItems: number,
  pageSize: number
): string {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  return `Showing ${start}–${end} of ${totalItems}`
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
}) => {
  if (totalPages <= 1) return null;

  const showSummary =
    totalItems !== undefined && pageSize !== undefined && totalItems > 0

  const renderPages = () => {
    const pages: React.ReactNode[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          type="button"
          onClick={() => onPageChange(1)}
          aria-label="Page 1"
          aria-current={currentPage === 1 ? "page" : undefined}
          className={cn(
            "h-9 w-9 rounded-md border text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            currentPage === 1
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          type="button"
          onClick={() => onPageChange(i)}
          aria-label={`Page ${i}`}
          aria-current={currentPage === i ? "page" : undefined}
          className={cn(
            "h-9 w-9 rounded-md border text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            currentPage === i
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          type="button"
          onClick={() => onPageChange(totalPages)}
          aria-label={`Page ${totalPages}`}
          aria-current={currentPage === totalPages ? "page" : undefined}
          className={cn(
            "h-9 w-9 rounded-md border text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            currentPage === totalPages
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={cn("space-y-2 py-4", className)}>
      {showSummary && (
        <p className="text-center text-xs text-muted-foreground">
          {getSummaryText(currentPage, totalItems, pageSize)}
        </p>
      )}
      <nav className="flex items-center justify-center space-x-2" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-center space-x-1">
          {renderPages()}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
};
