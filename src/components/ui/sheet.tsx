import React from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <SheetPortal>
      <SheetOverlay onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex justify-end">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { onOpenChange });
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
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in",
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
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 h-full w-full max-w-2xl border-l border-border bg-card p-6 shadow-2xl transition-transform duration-300 animate-in slide-in-from-right",
          side === "left" && "left-0 border-r animate-in slide-in-from-left",
          className
        )}
        {...props}
      >
        {children}
        {onOpenChange && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            <X className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left border-b border-border pb-4 mb-4", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col sm:flex-row sm:justify-end sm:space-x-2 border-t border-border pt-4 mt-6", className)} {...props} />
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
      className={cn("text-sm text-muted-foreground mt-1", className)}
      {...props}
    />
  )
)
SheetDescription.displayName = "SheetDescription"
