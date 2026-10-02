"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "ink";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variant === "primary" &&
            "bg-[#ff4d00] text-white rounded-full shadow-[0_6px_20px_rgba(255,77,0,0.28)]",
          variant === "ink" && "bg-[#111] text-white rounded-full",
          variant === "ghost" && "bg-transparent text-[#111] rounded-full",
          variant === "outline" &&
            "bg-white text-[#111] border border-[#ebebeb] rounded-full",
          size === "sm" && "min-h-[40px] px-4 text-[13px]",
          size === "md" && "min-h-[48px] px-[22px] text-[15px]",
          size === "lg" && "min-h-[52px] px-7 text-[16px]",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
