import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-900 dark:bg-white text-slate-50 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 shadow-sm focus-visible:ring-slate-900": variant === "default",
            "bg-red-500 text-slate-50 hover:bg-red-600 active:scale-95 shadow-sm focus-visible:ring-red-500": variant === "destructive",
            "border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 active:scale-95 focus-visible:ring-slate-900": variant === "outline",
            "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95": variant === "secondary",
            "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:bg-slate-200 dark:active:bg-slate-700": variant === "ghost",
            "text-slate-900 dark:text-white underline-offset-4 hover:underline": variant === "link",
            "bg-[#0066cc] text-white shadow-md shadow-blue-500/20 hover:bg-[#005bb5] hover:shadow-lg active:scale-95 focus-visible:ring-[#0066cc]/50": variant === "brand",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-full px-4 text-xs": size === "sm",
            "h-11 rounded-full px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
