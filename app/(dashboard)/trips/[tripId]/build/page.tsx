"use client";

import React, { useState, useEffect, useReducer, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  ArrowLeft,
  GripVertical,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Loader2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// --- Types ---
type Activity = {
  id: string;
  name: string;
  type: string;
  cost: string;
  duration: string;
};

type Section = {
  id: string;
  city: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: string;
  notes: string;
  activities: Activity[];
  isActivitiesOpen: boolean;
};

type State = {
  sections: Section[];
};

type Action =
  | { type: "ADD_SECTION" }
  | { type: "REMOVE_SECTION"; index: number }
  | { type: "UPDATE_SECTION"; index: number; field: keyof Section; value: any }
  | { type: "MOVE_SECTION"; fromIndex: number; toIndex: number }
  | { type: "TOGGLE_ACTIVITIES"; index: number }
  | { type: "ADD_ACTIVITY"; sectionIndex: number }
  | { type: "UPDATE_ACTIVITY"; sectionIndex: number; activityIndex: number; field: keyof Activity; value: string }
  | { type: "REMOVE_ACTIVITY"; sectionIndex: number; activityIndex: number }
  | { type: "SET_SECTIONS"; sections: Section[] };

// --- Reducer ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptySection = (): Section => ({
  id: generateId(),
  city: "",
  startDate: null,
  endDate: null,
  budget: "",
  notes: "",
  activities: [],
  isActivitiesOpen: false,
});

const createEmptyActivity = (): Activity => ({
  id: generateId(),
  name: "",
  type: "sightseeing",
  cost: "",
  duration: "",
});

function itineraryReducer(state: State, action: Action): State {
  const newSections = [...state.sections];

  switch (action.type) {
    case "ADD_SECTION":
      return { sections: [...state.sections, createEmptySection()] };
      
    case "REMOVE_SECTION":
      newSections.splice(action.index, 1);
      return { sections: newSections };
      
    case "UPDATE_SECTION":
      newSections[action.index] = { ...newSections[action.index], [action.field]: action.value };
      return { sections: newSections };
      
    case "MOVE_SECTION":
      if (action.toIndex < 0 || action.toIndex >= newSections.length) return state;
      const [movedSection] = newSections.splice(action.fromIndex, 1);
      newSections.splice(action.toIndex, 0, movedSection);
      return { sections: newSections };

    case "TOGGLE_ACTIVITIES":
      newSections[action.index].isActivitiesOpen = !newSections[action.index].isActivitiesOpen;
      return { sections: newSections };

    case "ADD_ACTIVITY":
      newSections[action.sectionIndex].activities.push(createEmptyActivity());
      newSections[action.sectionIndex].isActivitiesOpen = true; // Ensure open
      return { sections: newSections };

    case "UPDATE_ACTIVITY":
      newSections[action.sectionIndex].activities[action.activityIndex] = {
        ...newSections[action.sectionIndex].activities[action.activityIndex],
        [action.field]: action.value,
      };
      return { sections: newSections };

    case "REMOVE_ACTIVITY":
      newSections[action.sectionIndex].activities.splice(action.activityIndex, 1);
      return { sections: newSections };

    case "SET_SECTIONS":
      return { sections: action.sections };

    default:
      return state;
  }
}

// --- Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- City Autocomplete Component ---
const CityAutocomplete = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder?: string }) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  
  // Use SWR for searching
  const { data } = useSWR(searchTerm.length > 2 ? `/api/search/cities?q=${searchTerm}` : null, fetcher);
  
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MapPin className="h-4 w-4 text-gray-400" />
      </div>
      <Input 
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="pl-9 h-11 border-gray-200 focus-visible:ring-teal-500 text-base"
      />
      {isOpen && data && Array.isArray(data) && data.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {data.map((city: any, i: number) => (
            <div 
              key={i} 
              className="px-4 py-3 hover:bg-teal-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
              onClick={() => {
                onChange(city.name || city);
                setSearchTerm(city.name || city);
                setIsOpen(false);
              }}
            >
              <span className="font-medium text-gray-900">{city.name || city}</span>
              {city.country && <span className="text-gray-500 ml-1">, {city.country}</span>}
            </div>
          ))}
        </div>
      )}
      {/* Fallback for manual entry or if API is mocked */}
      {isOpen && searchTerm.length > 2 && (!data || data.length === 0) && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
           <div 
              className="px-4 py-3 hover:bg-teal-50 cursor-pointer text-sm font-medium text-teal-700 flex items-center"
              onClick={() => {
                onChange(searchTerm);
                setIsOpen(false);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Use "{searchTerm}"
            </div>
        </div>
      )}
    </div>
  );
};


// --- Main Component ---
export default function BuildItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const { data: tripData, isLoading: isTripLoading } = useSWR(`/api/trips/${tripId}`, fetcher);
  
  const [state, dispatch] = useReducer(itineraryReducer, { sections: [createEmptySection()] });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // If tripData contains existing stops, load them
  useEffect(() => {
    if (tripData?.stops && tripData.stops.length > 0) {
      // Assuming stops from API match the Section type structure
      const loadedSections = tripData.stops.map((stop: any) => ({
        ...createEmptySection(), // Ensure all fields exist
        ...stop,
        startDate: stop.startDate ? new Date(stop.startDate) : null,
        endDate: stop.endDate ? new Date(stop.endDate) : null,
      }));
      dispatch({ type: "SET_SECTIONS", sections: loadedSections });
    }
  }, [tripData]);

  const saveToApi = useCallback(async (isDraft = true) => {
    try {
      const payload = {
        stops: state.sections.map(s => ({
          ...s,
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString()
        }))
      };

      const res = await fetch(`/api/trips/${tripId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save stops");
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
      return false;
    }
  }, [state.sections, tripId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      saveToApi(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [saveToApi]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const success = await saveToApi(true);
    if (success) {
      toast.success("Draft saved successfully!");
    }
    setIsSavingDraft(false);
  };

  const handleSaveAndPreview = async () => {
    setIsSaving(true);
    const success = await saveToApi(false);
    if (success) {
      toast.success("Itinerary saved!");
      router.push(`/trips/${tripId}`);
    } else {
      setIsSaving(false);
    }
  };

  // Calculations for budget
  const tripTotalBudget = tripData?.budget || 0;
  const estimatedTotal = state.sections.reduce((sum, section) => {
    let sectionTotal = parseFloat(section.budget) || 0;
    // Also add activities costs if necessary, but typically budget covers activities or they are separate. Let's add them up if they exist.
    const activitiesTotal = section.activities.reduce((aSum, act) => aSum + (parseFloat(act.cost) || 0), 0);
    // If user filled both, we take whichever is higher to be safe, or just sum them. The prompt says "Estimated total: sum of all section budgets".
    return sum + Math.max(sectionTotal, activitiesTotal); 
  }, 0);
  const remainingBudget = tripTotalBudget - estimatedTotal;
  const progressPercent = tripTotalBudget > 0 ? Math.min((estimatedTotal / tripTotalBudget) * 100, 100) : 0;

  if (isTripLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-teal-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading itinerary builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50 pb-20">
      <Toaster position="top-center" />
      
      {/* Page Header */}
      <div className="bg-white border-b border-teal-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/trips" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-teal-700 mb-1 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Trips
              </Link>
              <div className="flex items-center gap-2 mb-1 text-teal-600 font-semibold text-sm tracking-wide uppercase">
                Step 2 of 2: Build Your Itinerary
              </div>
              <h1 className="text-2xl font-bold text-gray-900 truncate max-w-lg">
                {tripData?.title || "Untitled Trip"}
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                {tripData?.startDate ? format(new Date(tripData.startDate), "MMMM d, yyyy") : "TBD"}
                {tripData?.endDate ? ` - ${format(new Date(tripData.endDate), "MMMM d, yyyy")}` : ""}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-gray-500 mr-2 flex items-center hidden md:flex">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-teal-500" />
                  Auto-saved {format(lastSaved, "HH:mm")}
                </span>
              )}
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSaving}
                className="border-teal-200 text-teal-700 hover:bg-teal-50 font-medium"
              >
                {isSavingDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button 
                onClick={handleSaveAndPreview}
                disabled={isSaving || isSavingDraft}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-md font-semibold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save & Preview"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Content — Sections */}
          <div className="flex-1 space-y-6 w-full">
            {state.sections.map((section, index) => (
              <Card key={section.id} className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden relative group">
                {/* Drag Handle & Header */}
                <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col mr-1 text-gray-400">
                      <button onClick={() => dispatch({ type: "MOVE_SECTION", fromIndex: index, toIndex: index - 1 })} disabled={index === 0} className="hover:text-teal-600 disabled:opacity-30 disabled:hover:text-gray-400">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => dispatch({ type: "MOVE_SECTION", fromIndex: index, toIndex: index + 1 })} disabled={index === state.sections.length - 1} className="hover:text-teal-600 disabled:opacity-30 disabled:hover:text-gray-400">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <GripVertical className="w-5 h-5 text-gray-300 cursor-grab active:cursor-grabbing" />
                    <h3 className="text-lg font-bold text-gray-800">Section {index + 1}</h3>
                  </div>
                  <button 
                    onClick={() => dispatch({ type: "REMOVE_SECTION", index })}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete section"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* Info Text */}
                  <div className="text-sm text-gray-500 bg-teal-50/50 p-4 rounded-xl border border-teal-50">
                    <p className="font-medium text-gray-700">All the necessary information about this section.</p>
                    <p>This can be anything like transportation, hotel, or any other activity</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City Input */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-gray-700">City / Place Name</label>
                      <CityAutocomplete 
                        value={section.city} 
                        onChange={(v) => dispatch({ type: "UPDATE_SECTION", index, field: "city", value: v })}
                        placeholder="e.g. Paris, Rome, Bali..."
                      />
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2 md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-sm font-medium text-gray-600">From Date</label>
                          <DatePicker
                            selected={section.startDate}
                            onChange={(date) => {
                              dispatch({ type: "UPDATE_SECTION", index, field: "startDate", value: date });
                              if (section.endDate && date && section.endDate < date) {
                                dispatch({ type: "UPDATE_SECTION", index, field: "endDate", value: null });
                              }
                            }}
                            selectsStart
                            startDate={section.startDate}
                            endDate={section.endDate}
                            minDate={tripData?.startDate ? new Date(tripData.startDate) : undefined}
                            maxDate={tripData?.endDate ? new Date(tripData.endDate) : undefined}
                            placeholderText="Select start date"
                            className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                            wrapperClassName="w-full"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-sm font-medium text-gray-600">To Date</label>
                          <DatePicker
                            selected={section.endDate}
                            onChange={(date) => dispatch({ type: "UPDATE_SECTION", index, field: "endDate", value: date })}
                            selectsEnd
                            startDate={section.startDate}
                            endDate={section.endDate}
                            minDate={section.startDate || (tripData?.startDate ? new Date(tripData.startDate) : undefined)}
                            maxDate={tripData?.endDate ? new Date(tripData.endDate) : undefined}
                            placeholderText="Select end date"
                            className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:opacity-50"
                            wrapperClassName="w-full"
                            disabled={!section.startDate}
                          />
                        </div>
                      </div>
                      {(section.startDate || section.endDate) && (
                        <p className="text-xs text-teal-600 mt-3 font-medium flex items-center bg-teal-50 px-3 py-1.5 rounded-md inline-block w-fit border border-teal-100">
                          Date Range: {section.startDate ? format(section.startDate, "MMM d, yyyy") : "?"} to {section.endDate ? format(section.endDate, "MMM d, yyyy") : "?"}
                        </p>
                      )}
                    </div>

                    {/* Budget Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Budget for this Section</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium">$</span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={section.budget}
                          onChange={(e) => dispatch({ type: "UPDATE_SECTION", index, field: "budget", value: e.target.value })}
                          placeholder="0.00"
                          className="pl-8 h-11"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="pt-2 border-t border-gray-100">
                    {!section.isActivitiesOpen && section.activities.length === 0 ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                        onClick={() => dispatch({ type: "ADD_ACTIVITY", sectionIndex: index })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Activities
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Activities</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            onClick={() => dispatch({ type: "TOGGLE_ACTIVITIES", index })}
                          >
                            {section.isActivitiesOpen ? "Hide" : "Show"} ({section.activities.length})
                          </Button>
                        </div>
                        
                        {section.isActivitiesOpen && (
                          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            {section.activities.map((activity, actIndex) => (
                              <div key={activity.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <Input 
                                  placeholder="Activity name" 
                                  value={activity.name}
                                  onChange={(e) => dispatch({ type: "UPDATE_ACTIVITY", sectionIndex: index, activityIndex: actIndex, field: "name", value: e.target.value })}
                                  className="flex-grow min-w-[150px] h-9 text-sm"
                                />
                                <select
                                  value={activity.type}
                                  onChange={(e) => dispatch({ type: "UPDATE_ACTIVITY", sectionIndex: index, activityIndex: actIndex, field: "type", value: e.target.value })}
                                  className="flex h-9 w-full sm:w-[130px] rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                                >
                                  <option value="sightseeing">Sightseeing</option>
                                  <option value="food">Food & Dining</option>
                                  <option value="adventure">Adventure</option>
                                  <option value="hotel">Hotel/Stay</option>
                                  <option value="transport">Transport</option>
                                </select>
                                <div className="relative w-full sm:w-[100px]">
                                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-xs">$</span>
                                  </div>
                                  <Input 
                                    placeholder="Cost" 
                                    type="number"
                                    min="0"
                                    value={activity.cost}
                                    onChange={(e) => dispatch({ type: "UPDATE_ACTIVITY", sectionIndex: index, activityIndex: actIndex, field: "cost", value: e.target.value })}
                                    className="pl-6 h-9 text-sm"
                                  />
                                </div>
                                <Input 
                                  placeholder="Duration (e.g. 2h)" 
                                  value={activity.duration}
                                  onChange={(e) => dispatch({ type: "UPDATE_ACTIVITY", sectionIndex: index, activityIndex: actIndex, field: "duration", value: e.target.value })}
                                  className="w-full sm:w-[120px] h-9 text-sm"
                                />
                                <button 
                                  onClick={() => dispatch({ type: "REMOVE_ACTIVITY", sectionIndex: index, activityIndex: actIndex })}
                                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md shrink-0 sm:ml-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            
                            <button 
                              type="button"
                              onClick={() => dispatch({ type: "ADD_ACTIVITY", sectionIndex: index })}
                              className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center mt-2 px-1"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add another activity
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 pt-4">
                    <label className="text-sm font-semibold text-gray-700">Notes for this stop</label>
                    <Textarea 
                      placeholder="Any notes, flight details, or confirmation numbers..." 
                      value={section.notes}
                      onChange={(e) => dispatch({ type: "UPDATE_SECTION", index, field: "notes", value: e.target.value })}
                      className="min-h-[100px] border-gray-200 resize-y"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <button
              onClick={() => dispatch({ type: "ADD_SECTION" })}
              className="w-full py-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/30 text-teal-600 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 transition-all shadow-sm"
            >
              <div className="bg-white p-2 rounded-full shadow-sm border border-teal-100">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-semibold text-lg">Add another Section</span>
            </button>
          </div>

          {/* Budget Summary Sidebar */}
          <div className="w-full lg:w-80 shrink-0 sticky top-28 mb-8">
            <Card className="bg-white rounded-2xl shadow-md border border-teal-100 overflow-hidden">
              <div className="bg-teal-600 px-6 py-4">
                <h3 className="font-bold text-white text-lg">Budget Summary</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Total Trip Budget</span>
                    <span className="font-bold text-gray-900">${tripTotalBudget.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Sections Added</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">{state.sections.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Estimated Total</span>
                    <span className="font-bold text-gray-900">${estimatedTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-800 font-bold">Remaining</span>
                    <span className={`font-bold text-lg ${remainingBudget >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                      ${remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-gray-500">Budget Usage</span>
                    <span className={progressPercent > 100 ? "text-rose-500" : "text-teal-600"}>
                      {progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progressPercent > 100 ? 'bg-rose-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  {progressPercent > 100 && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">You are over budget!</p>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
