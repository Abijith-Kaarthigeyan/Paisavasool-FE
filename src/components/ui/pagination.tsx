import React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

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
          onClick={() => onPageChange(1)}
          className={cn(
            "h-9 w-9 text-sm rounded-md font-semibold transition-colors border",
            currentPage === 1
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background hover:bg-muted text-foreground"
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
          onClick={() => onPageChange(i)}
          className={cn(
            "h-9 w-9 text-sm rounded-md font-semibold transition-colors border",
            currentPage === i
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background hover:bg-muted text-foreground"
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
          onClick={() => onPageChange(totalPages)}
          className={cn(
            "h-9 w-9 text-sm rounded-md font-semibold transition-colors border",
            currentPage === totalPages
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background hover:bg-muted text-foreground"
          )}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <nav className={cn("flex items-center justify-center space-x-2 py-4", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50 text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <div className="flex items-center space-x-1">
        {renderPages()}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50 text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};
