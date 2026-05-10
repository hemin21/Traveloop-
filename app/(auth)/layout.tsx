import React from "react";
import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-slate-50 overflow-hidden selection:bg-teal-100 selection:text-teal-900">
      {/* Abstract Background Elements */}
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-teal-100/40 to-teal-50/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-amber-100/30 to-orange-50/10 blur-3xl pointer-events-none" />
      
      {/* Sticky Header/Logo */}
      <div className="absolute top-8 left-0 w-full px-8 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 text-teal-700 transition-opacity hover:opacity-80">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-200">
              <PlaneTakeoff className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Traveloop</span>
          </Link>
        </div>
      </div>

      <div className="z-10 w-full max-w-[1200px] mx-auto flex justify-center p-4">
        {children}
      </div>
    </div>
  );
}
