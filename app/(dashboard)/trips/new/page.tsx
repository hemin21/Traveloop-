"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  MapPin, 
  ArrowLeft, 
  User, 
  Users, 
  Heart, 
  Briefcase, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const TRIP_TYPES = [
  { id: "solo", label: "Solo Trip", icon: User },
  { id: "group", label: "Group Trip", icon: Users },
  { id: "family", label: "Family Trip", icon: Heart },
  { id: "business", label: "Business Trip", icon: Briefcase },
];

export default function NewTripPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [tripType, setTripType] = useState("solo");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title || title.length < 3) {
      newErrors.title = "Trip name must be at least 3 characters long.";
    }
    if (!startDate) {
      newErrors.startDate = "Start date is required.";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required.";
    }
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = "End date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        tripType,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        budget: budget ? parseFloat(budget) : undefined,
        description,
        isPublic,
      };

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create trip");
      }

      const data = await res.json();
      toast.success("Trip created successfully!");
      // Assuming the API returns the created trip object with an _id or id
      const tripId = data._id || data.id || "temp-id";
      
      // Redirect to the build itinerary page
      router.push(`/trips/${tripId}/build`);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating the trip. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 pb-20">
      <Toaster position="top-center" />
      
      {/* Top Navigation Bar / Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-xl">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan a New Trip</h1>
            <p className="text-gray-500 mt-1 text-lg">Start building your perfect travel experience</p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-3xl mx-auto px-4">
        <Card className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Trip Name */}
              <div className="space-y-3">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                  Trip Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: "" });
                  }}
                  placeholder="e.g. Europe Summer Adventure 2025"
                  className="h-12 text-lg px-4 border-gray-200 focus-visible:ring-teal-500"
                />
                {errors.title && <p className="text-sm text-rose-500 mt-1">{errors.title}</p>}
              </div>

              {/* Trip Type */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Trip Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TRIP_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = tripType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setTripType(type.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? "bg-teal-50 border-teal-600 text-teal-700 shadow-sm"
                            : "bg-white border-gray-100 text-gray-500 hover:border-teal-200 hover:bg-teal-50/50"
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? "text-teal-600" : "text-gray-400"}`} />
                        <span className="text-sm font-medium text-center">{type.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      if (errors.startDate) setErrors({ ...errors, startDate: "" });
                      if (endDate && date && endDate < date) {
                        setEndDate(null);
                      }
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    placeholderText="Select start date"
                    className={`flex h-12 w-full rounded-md border border-gray-200 bg-transparent px-4 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${errors.startDate ? 'border-rose-500' : ''}`}
                    wrapperClassName="w-full"
                  />
                  {errors.startDate && <p className="text-sm text-rose-500 mt-1">{errors.startDate}</p>}
                </div>
                
                <div className="space-y-3 flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => {
                      setEndDate(date);
                      if (errors.endDate) setErrors({ ...errors, endDate: "" });
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    placeholderText="Select end date"
                    className={`flex h-12 w-full rounded-md border border-gray-200 bg-transparent px-4 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${errors.endDate ? 'border-rose-500' : ''}`}
                    wrapperClassName="w-full"
                    disabled={!startDate}
                  />
                  {errors.endDate && <p className="text-sm text-rose-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-3">
                <label htmlFor="budget" className="block text-sm font-semibold text-gray-700">
                  Total Budget <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">$</span>
                  </div>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="h-12 pl-8 border-gray-200 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                  Trip Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your trip, goals, or any notes..."
                  className="min-h-[120px] resize-y border-gray-200 focus-visible:ring-teal-500 p-4"
                  rows={4}
                />
              </div>

              {/* Make Public Toggle */}
              <div className="flex items-start justify-between p-5 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="space-y-1">
                  <label className="text-base font-semibold text-gray-900">
                    Share with Community
                  </label>
                  <p className="text-sm text-gray-500">
                    Let others discover and get inspired by your trip.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isLoaded}
                  className="w-full h-14 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating your trip...
                    </>
                  ) : (
                    "Create Trip & Build Itinerary →"
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
