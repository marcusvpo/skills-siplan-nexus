import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        solid:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-border/50 bg-secondary/60 text-secondary-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive-foreground",
        outline: "border-border/60 text-foreground",
        muted: "border-border/40 bg-muted/50 text-muted-foreground",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const dotColors = {
  default: "bg-primary",
  solid: "bg-primary-foreground",
  secondary: "bg-muted-foreground",
  destructive: "bg-destructive",
  outline: "bg-foreground",
  muted: "bg-muted-foreground",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
} as const

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Exibe um micro-indicador vivo (ponto pulsante) antes do texto. */
  dot?: boolean
  /** Desliga a animação de pulso do ponto. */
  pulse?: boolean
}

function Badge({
  className,
  variant,
  dot = false,
  pulse = true,
  children,
  ...props
}: BadgeProps) {
  const dotColor = dotColors[(variant ?? "default") as keyof typeof dotColors]

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              dotColor
            )}
          />
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
