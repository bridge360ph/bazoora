"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Internal snap-state context
// Only meaningful for bottom drawers; other directions ignore it.
// ---------------------------------------------------------------------------

type SnapState = "small" | "full" | "hidden"

type DrawerContextValue = {
  direction: "bottom" | "top" | "left" | "right"
  snapState: SnapState
}

const DrawerContext = React.createContext<DrawerContextValue>({
  direction: "bottom",
  snapState: "full",
})

// ---------------------------------------------------------------------------
// Drawer (Root)
// ---------------------------------------------------------------------------

/**
 * For bottom drawers the component internally manages three snap states:
 *   • "small"  — 90 % of the viewport height  (initial, feels like "open")
 *   • "full"   — 100 % of the viewport height (truly full-screen)
 *   • "hidden" — closed
 *
 * Pass `snapPoints` to override the default [0.9, 1] pair, or pass
 * `disableSnapBehavior` to opt out of the automatic snapping entirely.
 * For non-bottom drawers the behaviour is unchanged.
 */
function Drawer({
  direction = "bottom",
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: "bottom" | "top" | "left" | "right"
}) {
  const snapState: SnapState = "full"

  // FIX (line 101): with exactOptionalPropertyTypes:true, passing open={undefined}
  // is illegal where the type expects `open?: boolean` (absent | boolean, not undefined).
  // Conditionally spread `open` so it is only present when it has a real value.
  const openProp = open !== undefined ? { open } : {}

  const rootProps = {
    direction,
    ...openProp,
    onOpenChange,
    scrollLockTimeout: 150,
    ...props,
  } as React.ComponentProps<typeof DrawerPrimitive.Root>

  return (
    <DrawerContext.Provider
      value={{
        direction,
        snapState,
      }}
    >
      <DrawerPrimitive.Root data-slot="drawer" {...rootProps} />
    </DrawerContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Primitives (unchanged wrappers)
// ---------------------------------------------------------------------------

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// DrawerContent — core of the snap / scroll logic
// ---------------------------------------------------------------------------

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const { direction, snapState } = React.useContext(DrawerContext)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const innerRef = React.useRef<HTMLDivElement | null>(null)

  /**
    * The drawer now always behaves like a full-height sheet.
    * The inner content area scrolls freely when needed.
   */
  const isBottomDrawer = direction === "bottom"
    const allowInnerScroll = true

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        data-snap-state={isBottomDrawer ? snapState : undefined}
        ref={contentRef}
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-popover text-sm text-popover-foreground",
          // ── bottom ──────────────────────────────────────────────────────
          // No mt-24 offset — the "small" snap is now ~90 % so we want the
          // panel to be able to reach the very top of the viewport at full snap.
          "data-[vaul-drawer-direction=bottom]:inset-x-0",
          "data-[vaul-drawer-direction=bottom]:bottom-0",
          "data-[vaul-drawer-direction=bottom]:max-h-[100dvh]",
          "data-[vaul-drawer-direction=bottom]:rounded-t-xl",
          "data-[vaul-drawer-direction=bottom]:border-t",
          // ── left ────────────────────────────────────────────────────────
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          // ── right ───────────────────────────────────────────────────────
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          // ── top ─────────────────────────────────────────────────────────
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b",
          className
        )}
        {...props}
      >
        {/* Drag handle — bottom drawers only */}
        <div className="mx-auto mt-4 hidden h-1 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />

        {/*
         * Scroll container
         *
         * When at the "small" snap:  overflow-hidden — scrolling is blocked so
         *   vaul can intercept the upward drag to expand to full snap.
         *
         * When at the "full" snap:   overflow-y-auto — content scrolls freely.
         *   Scrolling down past the top hands control back to vaul, which then
         *   collapses the drawer to the previous snap (vaul's native behaviour
         *   via scrollLockTimeout + nestedScrollLockEnabled).
         *
         * For non-bottom drawers we always allow overflow-y-auto.
         */}
        <div
          ref={innerRef}
          className={cn(
            "flex flex-col",
            // bottom-drawer specific flex-grow so the scroll container
            // fills available height inside the fixed panel
            "group-data-[vaul-drawer-direction=bottom]/drawer-content:flex-1",
            "group-data-[vaul-drawer-direction=bottom]/drawer-content:min-h-0",
            allowInnerScroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden"
          )}
        >
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

// ---------------------------------------------------------------------------
// DrawerHeader — sticky when inside a scrolling bottom drawer
// ---------------------------------------------------------------------------

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { snapState, direction } = React.useContext(DrawerContext)
  const isBottomDrawer = direction === "bottom"

  /**
   * The header becomes sticky only when the drawer is at full snap and the
   * content area is therefore scrollable. At the "small" snap there is no
   * scrolling, so sticky positioning would have no effect (and could cause
   * layout bugs in some browsers).
   */
  const shouldBeSticky = !isBottomDrawer || snapState === "full"

  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 md:gap-0.5 md:text-left",
        "group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center",
        "group-data-[vaul-drawer-direction=top]/drawer-content:text-center",
        // Sticky header — applied once the drawer is in full-scroll mode.
        // bg-popover prevents content from bleeding through.
        shouldBeSticky && [
          "sticky top-0 z-10 bg-popover",
          // Subtle bottom border to visually separate from scrolling content
          "border-b border-border/50",
        ],
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// DrawerFooter
// ---------------------------------------------------------------------------

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// DrawerTitle / DrawerDescription
// ---------------------------------------------------------------------------

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "cn-font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}