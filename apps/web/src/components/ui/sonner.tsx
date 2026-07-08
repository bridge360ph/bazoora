"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <style>{`
        [data-sonner-toast] {
          display: flex !important;
          align-items: flex-start !important;
          gap: 8px !important;
          overflow: hidden !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          background-color: color-mix(in srgb, var(--normal-bg) 70%, transparent) !important;
          background-image: none !important;
          transition: opacity 200ms ease, transform 300ms ease, height 300ms ease, border-color 200ms ease, background-image 200ms ease !important;
        }

        [data-sonner-toast] [data-content] {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }

        [data-sonner-toast] [data-icon] {
          align-self: center !important;
          margin-top: 0 !important;
          flex-shrink: 0 !important;
        }

        [data-sonner-toast] [data-title] {
          font-weight: 700 !important;
          font-size: 0.9rem !important;
        }

        /* Left accent line — transparent by default (stacked toasts get no line),
           only the front toast reveals it. No transition override here so
           Sonner's own stacking transitions (transform, opacity, height) are preserved. */
        [data-sonner-toast] {
          border-left: 4px solid transparent !important;
          padding-left: calc(var(--toast-padding-left, 16px) + 4px) !important;
        }

        [data-sonner-toast][data-front="true"] {
          border-left-color: var(--border) !important;
        }

        /* Type colours — tint only, never replace the base background */
        [data-sonner-toast][data-type="success"][data-front="true"] {
          border-left-color: #16a34a !important;
          background-image: linear-gradient(
            rgba(22, 163, 74, 0.12),
            rgba(22, 163, 74, 0.12)
          ) !important;
        }
        [data-sonner-toast][data-type="success"]:not([data-front="true"]) {
          background-image: linear-gradient(
            rgba(22, 163, 74, 0.04),
            rgba(22, 163, 74, 0.04)
          ) !important;
        }

        [data-sonner-toast][data-type="error"][data-front="true"] {
          border-left-color: #dc2626 !important;
          background-image: linear-gradient(
            rgba(220, 38, 38, 0.12),
            rgba(220, 38, 38, 0.12)
          ) !important;
        }
        [data-sonner-toast][data-type="error"]:not([data-front="true"]) {
          background-image: linear-gradient(
            rgba(220, 38, 38, 0.04),
            rgba(220, 38, 38, 0.04)
          ) !important;
        }

        [data-sonner-toast][data-type="info"][data-front="true"] {
          border-left-color: #2563eb !important;
          background-image: linear-gradient(
            rgba(37, 99, 235, 0.12),
            rgba(37, 99, 235, 0.12)
          ) !important;
        }
        [data-sonner-toast][data-type="info"]:not([data-front="true"]) {
          background-image: linear-gradient(
            rgba(37, 99, 235, 0.04),
            rgba(37, 99, 235, 0.04)
          ) !important;
        }

        [data-sonner-toast][data-type="warning"][data-front="true"] {
          border-left-color: #d97706 !important;
          background-image: linear-gradient(
            rgba(217, 119, 6, 0.12),
            rgba(217, 119, 6, 0.12)
          ) !important;
        }
        [data-sonner-toast][data-type="warning"]:not([data-front="true"]) {
          background-image: linear-gradient(
            rgba(217, 119, 6, 0.04),
            rgba(217, 119, 6, 0.04)
          ) !important;
        }
        
        /* Close button */
        [data-sonner-toast] [data-close-button] {
          position: relative !important;
          inset: unset !important;
          transform: none !important;
          margin: 0 !important;
          margin-top: 1px !important;
          align-self: flex-start !important;
          flex-shrink: 0 !important;
          order: 999 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 22px !important;
          height: 22px !important;
          border-radius: calc(var(--radius) - 2px) !important;
          background-color: transparent !important;
          color: var(--muted-foreground) !important;
          border: 2px solid var(--border) !important;
          /* Smooth show/hide (opacity) and hover state transitions */
          transition:
            background-color 150ms ease,
            color 150ms ease,
            border-color 150ms ease,
            opacity 200ms ease !important;
        }

        [data-sonner-toast] [data-close-button]:hover {
          background-color: var(--muted) !important;
          color: var(--foreground) !important;
          border-color: var(--foreground) !important;
        }

        [data-sonner-toast] [data-close-button]:active {
          background-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
          border-color: var(--accent-foreground) !important;
        }

        [data-sonner-toast] [data-close-button] svg {
          width: 13px !important;
          height: 13px !important;
          stroke-width: 3 !important;
          color: inherit !important;
        }

        [data-sonner-toast][data-type="success"] [data-close-button] {
          color: #16a34a !important;
          border-color: #16a34a !important;
        }
        [data-sonner-toast][data-type="success"] [data-close-button]:hover {
          background-color: #16a34a !important;
          color: #ffffff !important;
          border-color: #16a34a !important;
        }
        [data-sonner-toast][data-type="success"] [data-close-button]:active {
          background-color: #15803d !important;
          color: #ffffff !important;
          border-color: #15803d !important;
        }

        [data-sonner-toast][data-type="error"] [data-close-button] {
          color: #dc2626 !important;
          border-color: #dc2626 !important;
        }
        [data-sonner-toast][data-type="error"] [data-close-button]:hover {
          background-color: #dc2626 !important;
          color: #ffffff !important;
          border-color: #dc2626 !important;
        }
        [data-sonner-toast][data-type="error"] [data-close-button]:active {
          background-color: #b91c1c !important;
          color: #ffffff !important;
          border-color: #b91c1c !important;
        }

        [data-sonner-toast][data-type="info"] [data-close-button] {
          color: #2563eb !important;
          border-color: #2563eb !important;
        }
        [data-sonner-toast][data-type="info"] [data-close-button]:hover {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
        }
        [data-sonner-toast][data-type="info"] [data-close-button]:active {
          background-color: #1d4ed8 !important;
          color: #ffffff !important;
          border-color: #1d4ed8 !important;
        }

        [data-sonner-toast][data-type="warning"] [data-close-button] {
          color: #d97706 !important;
          border-color: #d97706 !important;
        }
        [data-sonner-toast][data-type="warning"] [data-close-button]:hover {
          background-color: #d97706 !important;
          color: #ffffff !important;
          border-color: #d97706 !important;
        }
        [data-sonner-toast][data-type="warning"] [data-close-button]:active {
          background-color: #b45309 !important;
          color: #ffffff !important;
          border-color: #b45309 !important;
        }
      `}</style>

      <Sonner
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        position="bottom-left"
        closeButton
        className="toaster group"
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
        toastOptions={{
          closeButton: true,
        }}
        {...props}
      />
    </>
  );
};

export { Toaster };