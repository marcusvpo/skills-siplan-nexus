import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Classe do indicador (permite trocar a cor de preenchimento). */
  indicatorClassName?: string
  /** Desliga o brilho na ponta da barra. */
  glow?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, glow = true, ...props }, ref) => {
  const pct = Math.min(100, Math.max(0, value || 0))

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted/60",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "relative h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700 ease-out",
          indicatorClassName
        )}
        style={{ width: `${pct}%` }}
      >
        {glow && pct > 0 && (
          <span className="absolute right-0 top-1/2 h-full w-3 -translate-y-1/2 rounded-full bg-primary opacity-90 blur-[3px]" />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
