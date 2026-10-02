"use client";

import React from "react";
import { logClientError } from "@/lib/error-log";

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "حدث خطأ" };
  }

  componentDidCatch(error: Error) {
    logClientError(error.message, { stack: error.stack, source: "boundary" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="card p-6 max-w-sm w-full space-y-3">
            <h1 className="text-19 font-semibold">تعذّر عرض الصفحة</h1>
            <p className="text-14 text-[#8a8a8a] leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.href = "/";
              }}
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
