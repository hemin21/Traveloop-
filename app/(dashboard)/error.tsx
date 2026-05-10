"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard boundary error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 mb-6 bg-red-100 rounded-full">
        <AlertCircle className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong!</h2>
      <p className="max-w-md mb-8 text-gray-600">
        We encountered an unexpected error while loading this page. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="flex items-center gap-2">
          <RefreshCcw size={16} />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go back home
        </Button>
      </div>
    </div>
  );
}
