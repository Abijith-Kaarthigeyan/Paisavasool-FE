import React, { createContext, useContext, useState, useCallback } from "react"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextProps {
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextProps | null>(null);

const toastAccentStyles: Record<ToastType, string> = {
  success: "border-l-success bg-card",
  error: "border-l-destructive bg-card",
  warning: "border-l-warning bg-card",
  info: "border-l-primary bg-card",
}

const toastIconStyles: Record<ToastType, string> = {
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-primary",
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = "info", duration = 3000 }: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, title, description, type, duration }]);
      
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col space-y-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const type = t.type ?? "info"
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "flex items-start border border-border border-l-4 p-4 animate-in slide-in-from-top duration-200",
                toastAccentStyles[type]
              )}
            >
              <div className="mr-3 mt-0.5 shrink-0" aria-hidden>
                {type === "success" && <CheckCircle className={cn("h-5 w-5", toastIconStyles[type])} />}
                {type === "error" && <AlertCircle className={cn("h-5 w-5", toastIconStyles[type])} />}
                {type === "warning" && <AlertCircle className={cn("h-5 w-5", toastIconStyles[type])} />}
                {type === "info" && <Info className={cn("h-5 w-5", toastIconStyles[type])} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-4 shrink-0 rounded-sm text-muted-foreground opacity-60 transition-opacity hover:text-foreground hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
