import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-teal-50">
      <div className="flex items-center justify-center w-24 h-24 mb-8 bg-teal-100 rounded-full">
        <Compass className="w-12 h-12 text-teal-600 animate-spin-slow" />
      </div>
      <h1 className="mb-2 text-6xl font-bold text-teal-900">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-gray-800">Lost your way?</h2>
      <p className="max-w-md mb-8 text-gray-600">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link href="/">
        <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
