"use client";

import React from "react";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  compact?: boolean; // Show only flag + code
}

export function CurrencySelector({ value, onChange, className, compact = false }: CurrencySelectorProps) {
  const selected = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-slate-200 rounded-xl h-11 pl-10 pr-8 text-sm text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer transition-all hover:border-slate-300"
        title="Select Currency"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {compact
              ? `${currency.flag} ${currency.code}`
              : `${currency.flag} ${currency.code} – ${currency.name} (${currency.symbol})`}
          </option>
        ))}
      </select>
      {/* Flag overlay */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
        {selected.flag}
      </span>
      {/* Chevron */}
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
