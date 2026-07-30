import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/10 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
        glow:
          "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/10 hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/25",
        outline:
          "border border-border/70 bg-background/40 backdrop-blur-sm hover:border-primary/40 hover:bg-accent/60 hover:text-accent-foreground",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:bg-secondary",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const MotionButton = motion.button

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      return <Slot className={classes} ref={ref} {...props} />
    }

    return (
      <MotionButton
        className={classes}
        ref={ref}
        whileTap={props.disabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...(props as HTMLMotionProps<"button">)}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
