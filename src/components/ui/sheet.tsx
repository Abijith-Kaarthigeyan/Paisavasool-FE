import React, { useEffect, useId, useRef } from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/lib/use-focus-trap"
import { useOverlay } from "@/lib/use-overlay"

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  useOverlay(open, onOpenChange)

  if (!open) return null;

  return (
    <SheetPortal>
      <SheetOverlay onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex justify-end">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onOpenChange?: (open: boolean) => void }>, { onOpenChange });
          }
          return child;
        })}
      </div>
    </SheetPortal>
  );
};

export const SheetPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
};

export const SheetOverlay: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 animate-in fade-in",
      className
    )}
    {...props}
  />
);

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpenChange?: (open: boolean) => void;
  side?: "right" | "left";
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, onOpenChange, side = "right", ...props }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const titleId = useId()
    useFocusTrap(contentRef, true)

    useEffect(() => {
      const title = contentRef.current?.querySelector("h2")
      if (title && !title.id) title.id = titleId
    }, [titleId, children])

    return (
      <div
        ref={(node) => {
          contentRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-50 h-full w-full max-w-3xl border-border bg-card p-6 shadow-popover transition-transform duration-200 animate-in",
          side === "right" && "border-l slide-in-from-right",
          side === "left" && "border-r slide-in-from-left",
          className
        )}
        {...props}
      >
        {children}
        {onOpenChange && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close panel"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5 text-muted-foreground" aria-hidden />
          </button>
        )}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("mb-4 flex flex-col space-y-1.5 border-b border-border pb-4 text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("mt-6 flex flex-col border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

export const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
)
SheetTitle.displayName = "SheetTitle"

export const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
SheetDescription.displayName = "SheetDescription"
