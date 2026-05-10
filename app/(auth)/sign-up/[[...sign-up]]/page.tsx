"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Phone, MapPin, Globe, FileText,
  Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    country: "",
    additionalInfo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone,
          city: formData.city,
          country: formData.country,
          additionalInfo: formData.additionalInfo,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to main app
        window.location.href = "/";
      } else {
        setError(result.error || "Failed to register account.");
      }
    } catch (err: any) {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Registration form UI ─────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl shadow-teal-900/10 rounded-3xl p-8 md:p-10">

        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-teal-200">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Start planning your perfect journey today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* First Name */}
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                First Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                Last Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="city"
                  type="text"
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Country */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                Country
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="country"
                  type="text"
                  placeholder="India"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-slate-700">
                About You <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  id="additionalInfo"
                  placeholder="Tell us about your travel style and preferences..."
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-teal-200 transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account & Continue"
            )}
          </button>
        </form>

        <div className="mt-7 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-teal-600 font-semibold hover:underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
