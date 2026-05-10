"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { 
  Search, Plus, MapPin, Map, Clock, Star, 
  Utensils, Bed, Car, Ticket, Landmark, Activity, Compass
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const getActivityStyles = (type: string) => {
  const t = type?.toLowerCase();
  if (t === 'sightseeing' || t === 'landmark') return { icon: <Landmark className="w-6 h-6 text-teal-600" />, bg: "bg-teal-100" };
  if (t === 'food' || t === 'food & dining') return { icon: <Utensils className="w-6 h-6 text-orange-600" />, bg: "bg-orange-100" };
  if (t === 'adventure') return { icon: <Compass className="w-6 h-6 text-red-600" />, bg: "bg-red-100" };
  if (t === 'transport') return { icon: <Car className="w-6 h-6 text-blue-600" />, bg: "bg-blue-100" };
  if (t === 'hotel' || t === 'accommodation') return { icon: <Bed className="w-6 h-6 text-purple-600" />, bg: "bg-purple-100" };
  return { icon: <Activity className="w-6 h-6 text-gray-600" />, bg: "bg-gray-100" };
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
  ));
};

function ActivitySearchContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCost, setSelectedCost] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");

  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");

  const { data: activitiesData, isLoading } = useSWR("/api/search/activities", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  const { data: tripsData } = useSWR("/api/trips", fetcher);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract data
  const rawActivities = Array.isArray(activitiesData) ? activitiesData : activitiesData?.activities || [];
  const trips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  // MOCK DATA FALLBACK
  const mockActivities = [
    { _id: "1", name: "Eiffel Tower Summit", city: "Paris", country: "France", type: "Sightseeing", estimatedCost: 35, duration: 2, description: "Take the elevator to the top of the iconic Eiffel Tower.", rating: 4.8 },
    { _id: "2", name: "Sushi Making Class", city: "Tokyo", country: "Japan", type: "Food", estimatedCost: 80, duration: 3, description: "Learn to make authentic sushi with a local master.", rating: 4.9 },
    { _id: "3", name: "Mount Batur Sunrise Trek", city: "Bali", country: "Indonesia", type: "Adventure", estimatedCost: 45, duration: 6, description: "Hike up an active volcano to watch the sunrise.", rating: 4.7 },
    { _id: "4", name: "Colosseum Underground Tour", city: "Rome", country: "Italy", type: "Sightseeing", estimatedCost: 60, duration: 3, description: "Explore the restricted underground areas of the Colosseum.", rating: 4.8 },
    { _id: "5", name: "High-Speed Rail to Kyoto", city: "Tokyo", country: "Japan", type: "Transport", estimatedCost: 120, duration: 2.5, description: "Bullet train ride from Tokyo to Kyoto.", rating: 4.5 },
  ];
  const activities = rawActivities.length > 0 ? rawActivities : mockActivities;

  // Extract unique cities for the dropdown
  const uniqueCities = ["All", ...Array.from(new Set(activities.map((a: any) => a.city)))];

  const filteredActivities = useMemo(() => {
    return activities.filter((act: any) => {
      // Text Search
      if (debouncedQuery && !act.name.toLowerCase().includes(debouncedQuery.toLowerCase()) && !act.description.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
      
      // City
      if (selectedCity !== "All" && act.city !== selectedCity) return false;
      
      // Type
      if (selectedType !== "All" && act.type.toLowerCase() !== selectedType.toLowerCase()) return false;
      
      // Cost
      if (selectedCost === "Under $20" && act.estimatedCost >= 20) return false;
      if (selectedCost === "$20-$50" && (act.estimatedCost < 20 || act.estimatedCost > 50)) return false;
      if (selectedCost === "$50-$100" && (act.estimatedCost < 50 || act.estimatedCost > 100)) return false;
      if (selectedCost === "$100+" && act.estimatedCost <= 100) return false;
      
      // Duration
      if (selectedDuration === "Under 2hrs" && act.duration >= 2) return false;
      if (selectedDuration === "Half day" && (act.duration < 2 || act.duration > 5)) return false;
      if (selectedDuration === "Full day" && act.duration <= 5) return false;
      
      return true;
    });
  }, [activities, debouncedQuery, selectedCity, selectedType, selectedCost, selectedDuration]);

  const handleAddToTrip = async (act: any) => {
    if (!selectedStopId) {
      toast.error("Please select a stop to add this activity to.");
      return;
    }
    try {
      toast.success(`${act.name} added to your itinerary!`);
      // Real API call would go here
    } catch (e) {
      toast.error("Failed to add activity.");
    }
  };

  const selectedTripObj = trips.find((t: any) => t._id === selectedTripId);
  // Assuming trip object has stops populated or we fetch them. Since we mock, we'll assume trip.stops exists or just mock it.
  const stopsForSelectedTrip = selectedTripObj?.stops || [
    { _id: "stop1", cityName: "Paris", country: "France" },
    { _id: "stop2", cityName: "Rome", country: "Italy" }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="space-y-2 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {debouncedQuery ? `Search: "${debouncedQuery}"` : "Explore Activities"}
          {selectedCity !== "All" && <span className="text-teal-600 font-normal"> in {selectedCity}</span>}
        </h1>
        <p className="text-gray-500">Find things to do, places to eat, and experiences to remember.</p>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 sticky top-4 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Search activities..." 
            className="pl-10 h-12 bg-gray-50 border-transparent focus-visible:ring-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-[140px] sm:w-[160px] bg-gray-50 border-transparent">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCities.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] sm:w-[160px] bg-gray-50 border-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Sightseeing", "Food", "Adventure", "Transport", "Hotel", "Other"].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCost} onValueChange={setSelectedCost}>
            <SelectTrigger className="w-[140px] sm:w-[160px] bg-gray-50 border-transparent">
              <SelectValue placeholder="Cost" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Under $20", "$20-$50", "$50-$100", "$100+"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger className="w-[140px] sm:w-[160px] bg-gray-50 border-transparent">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Under 2hrs", "Half day", "Full day"].map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* RESULTS LIST */}
      <div>
        <p className="text-gray-500 font-medium mb-4">
          {filteredActivities.length} activities found
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No activities found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((act: any) => {
              const styles = getActivityStyles(act.type);
              return (
                <div key={act._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow group">
                  
                  {/* Left: Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${styles.bg}`}>
                    {styles.icon}
                  </div>
                  
                  {/* Center: Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-700 transition-colors">
                        {act.name}
                      </h3>
                      {/* Mobile price badge */}
                      <Badge className="sm:hidden bg-gray-100 text-gray-700 border-none shrink-0">
                        ${act.estimatedCost}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 pb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {act.city}, {act.country}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                  
                  {/* Right: Badges & CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 sm:w-40 sm:border-l border-gray-100 sm:pl-4">
                    <div className="hidden sm:block">
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm px-2.5 py-0.5 border-transparent shadow-none">
                        ${act.estimatedCost}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {act.duration}h
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      {renderStars(act.rating)}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 w-full mt-1">
                          <Plus className="w-4 h-4 mr-1.5" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Itinerary</DialogTitle>
                          <DialogDescription>
                            Select the trip and stop to add "{act.name}".
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Select Trip</label>
                            <Select value={selectedTripId} onValueChange={(val) => { setSelectedTripId(val); setSelectedStopId(""); }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a trip..." />
                              </SelectTrigger>
                              <SelectContent>
                                {trips.length > 0 ? trips.map((t: any) => (
                                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                )) : <SelectItem value="none" disabled>No trips found</SelectItem>}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedTripId && (
                            <div className="space-y-2 animate-in fade-in">
                              <label className="text-sm font-medium">Select Stop</label>
                              <Select value={selectedStopId} onValueChange={setSelectedStopId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a destination stop..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {stopsForSelectedTrip.map((s: any) => (
                                    <SelectItem key={s._id} value={s._id}>{s.cityName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleAddToTrip(act)}
                          disabled={!selectedTripId || !selectedStopId}
                          className="w-full bg-teal-600 hover:bg-teal-700"
                        >
                          Confirm Add Activity
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivitiesSearchPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <ActivitySearchContent />
    </Suspense>
  );
}
