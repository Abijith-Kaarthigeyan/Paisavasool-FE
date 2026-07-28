import React, { useEffect, useId, useRef } from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/lib/use-focus-trap"
import { useOverlay } from "@/lib/use-overlay"

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useOverlay(open, onOpenChange)

  if (!open) return null;
  
  return (
    <DialogPortal>
      <DialogOverlay onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onOpenChange?: (open: boolean) => void }>, { onOpenChange });
          }
          return child;
        })}
      </div>
    </DialogPortal>
  );
};

export const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
};

export const DialogOverlay: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 animate-in fade-in",
      className
    )}
    {...props}
  />
);

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpenChange?: (open: boolean) => void;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onOpenChange, ...props }, ref) => {
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
          "relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-popover duration-200 animate-in fade-in zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
        {onOpenChange && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn("mt-6 flex flex-col-reverse border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("mt-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"

export const DialogClose: React.FC<{ children: React.ReactNode; onOpenChange?: (open: boolean) => void }> = ({
  children,
  onOpenChange,
}) => {
  return (
    <div onClick={() => onOpenChange?.(false)} className="contents">
      {children}
    </div>
  );
};
