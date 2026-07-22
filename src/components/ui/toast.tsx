"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  className?: string;
}

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success" />,
  error: <AlertCircle className="h-5 w-5 text-error" />,
  info: <Info className="h-5 w-5 text-secondary" />,
  warning: <AlertTriangle className="h-5 w-5 text-accent" />,
};

function ToastContainer({ toasts, onDismiss, className }: ToastProps) {
  return (
    <div className={cn("fixed bottom-4 right-4 z-50 flex flex-col gap-2", className)}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex w-80 items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-elevated"
          >
            <span className="mt-0.5 shrink-0">{iconMap[toast.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-body text-foreground">
                {toast.message}
              </p>
              {toast.description && (
                <p className="text-xs font-body text-muted mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md p-0.5 text-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { ToastContainer };
export type { ToastProps, ToastData, ToastType };
