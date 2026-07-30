import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * TabsList com indicador de "pílula deslizante": um fundo absoluto
 * que mede o gatilho ativo e desliza suavemente até ele.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = React.useState<{
    left: number
    top: number
    width: number
    height: number
    ready: boolean
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false })

  const syncIndicator = React.useCallback(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>('[data-state="active"]')
    if (!active) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }
    setIndicator({
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
      ready: true,
    })
  }, [])

  React.useLayoutEffect(() => {
    syncIndicator()
    const list = listRef.current
    if (!list) return

    const observer = new MutationObserver(syncIndicator)
    observer.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    })

    const resizeObserver = new ResizeObserver(syncIndicator)
    resizeObserver.observe(list)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
    }
  }, [syncIndicator, children])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<unknown>).current = node
      }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-border/50 bg-muted/40 p-1 text-muted-foreground backdrop-blur-md",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full bg-primary/15 ring-1 ring-primary/25 shadow-sm shadow-primary/10 transition-all duration-300 ease-out",
          indicator.ready ? "opacity-100" : "opacity-0"
        )}
        style={{
          left: indicator.left,
          top: indicator.top,
          width: indicator.width,
          height: indicator.height,
        }}
      />
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground data-[state=active]:text-foreground",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
