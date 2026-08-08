'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { ...toast, id }
    
    // Prevent duplicate toasts with exact same title/description
    setToasts((prev) => {
      const exists = prev.some(t => t.title === toast.title && t.description === toast.description);
      if (exists) return prev;
      return [...prev, newToast];
    });

    const duration = toast.duration ?? 3500
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onClose }: { toasts: ToastProps[], onClose: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => toast.id && onClose(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const icons = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = icons[variant]

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-slide-up transition-all duration-300",
        {
          "bg-white/95 dark:bg-[#1d1d1f]/95 border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white": variant === "default",
          "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-50": variant === "success",
          "bg-rose-50/95 dark:bg-rose-950/90 border-rose-200/80 dark:border-rose-800/50 text-rose-950 dark:text-rose-50": variant === "error",
          "bg-amber-50/95 dark:bg-amber-950/90 border-amber-200/80 dark:border-amber-800/50 text-amber-950 dark:text-amber-50": variant === "warning",
          "bg-blue-50/95 dark:bg-blue-950/90 border-blue-200/80 dark:border-blue-800/50 text-blue-950 dark:text-blue-50": variant === "info",
        }
      )}
    >
      <div className={cn("p-1.5 rounded-xl shrink-0 mt-0.5", {
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300": variant === "default",
        "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400": variant === "success",
        "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400": variant === "error",
        "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400": variant === "warning",
        "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400": variant === "info",
      })}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-bold text-xs sm:text-sm tracking-[-0.01em]">
            {title}
          </div>
        )}
        {description && (
          <div className="text-xs font-semibold opacity-90 mt-0.5 leading-relaxed">
            {description}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-xl p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
