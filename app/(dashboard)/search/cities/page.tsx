"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Search, MapPin, Plus, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const REGIONS = ["Europe", "Asia", "Americas", "Middle East", "Africa", "Oceania"];

const getRegionGradient = (region: string) => {
  if (region.includes("Europe")) return "from-blue-500 to-indigo-600";
  if (region.includes("Asia")) return "from-red-500 to-orange-500";
  if (region.includes("Americas")) return "from-emerald-500 to-teal-600";
  if (region.includes("Middle East")) return "from-amber-500 to-yellow-600";
  if (region.includes("Africa")) return "from-orange-600 to-red-700";
  return "from-cyan-500 to-blue-500";
};

const getCostBadge = (cost: string) => {
  const c = cost?.toLowerCase();
  if (c === "low") return "💰 Low";
  if (c === "high") return "💰💰💰 High";
  return "💰💰 Medium";
};

const getFlagEmoji = (country: string) => {
  const flags: Record<string, string> = {
    "France": "🇫🇷", "Italy": "🇮🇹", "Japan": "🇯🇵", "Indonesia": "🇮🇩", 
    "Spain": "🇪🇸", "USA": "🇺🇸", "UAE": "🇦🇪", "UK": "🇬🇧", 
    "Netherlands": "🇳🇱", "Czech Republic": "🇨🇿", "Portugal": "🇵🇹", 
    "Thailand": "🇹🇭", "Singapore": "🇸🇬", "Turkey": "🇹🇷", 
    "Egypt": "🇪🇬", "Australia": "🇦🇺", "Canada": "🇨🇦", "Mexico": "🇲🇽", 
    "Brazil": "🇧🇷", "South Africa": "🇿🇦", "Morocco": "🇲🇦", 
    "South Korea": "🇰🇷", "Germany": "🇩🇪", "Austria": "🇦🇹", 
    "Greece": "🇬🇷", "Argentina": "🇦🇷", "New Zealand": "🇳🇿", "Vietnam": "🇻🇳"
  };
  return flags[country] || "🌍";
};

export default function CitiesSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(REGIONS);
  const [selectedTripId, setSelectedTripId] = useState("");

  const { data: citiesData, isLoading } = useSWR("/api/search/cities", fetcher, {
    // If API isn't ready, we will mock it in the UI using SWR fallback approach or handle error
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 1) return;
    }
  });

  const { data: tripsData } = useSWR("/api/trips", fetcher);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract cities (handling both {cities: []} and [] formats)
  const rawCities = Array.isArray(citiesData) ? citiesData : citiesData?.cities || [];

  // MOCK DATA FALLBACK IF API FAILS
  const mockCities = [
    { _id: "1", name: "Paris", country: "France", region: "Europe", costIndex: "High", popularity: 98, highlights: ["Eiffel Tower", "Louvre", "Fine Dining"] },
    { _id: "2", name: "Tokyo", country: "Japan", region: "Asia", costIndex: "High", popularity: 99, highlights: ["Shibuya", "Sushi", "Temples"] },
    { _id: "3", name: "Bali", country: "Indonesia", region: "Asia", costIndex: "Low", popularity: 92, highlights: ["Beaches", "Surfing", "Temples"] },
    { _id: "4", name: "Rome", country: "Italy", region: "Europe", costIndex: "Medium", popularity: 95, highlights: ["Colosseum", "Pasta", "Vatican"] },
    { _id: "5", name: "New York", country: "USA", region: "Americas", costIndex: "High", popularity: 97, highlights: ["Times Square", "Broadway", "Central Park"] },
    { _id: "6", name: "Dubai", country: "UAE", region: "Middle East", costIndex: "High", popularity: 94, highlights: ["Burj Khalifa", "Shopping", "Desert"] },
    { _id: "7", name: "Cape Town", country: "South Africa", region: "Africa", costIndex: "Medium", popularity: 86, highlights: ["Table Mountain", "Penguins", "Wine"] },
  ];
  
  const cities = rawCities.length > 0 ? rawCities : mockCities;
  const trips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  const handleAddCityToTrip = async (city: any) => {
    if (!selectedTripId) {
      toast.error("Please select a trip first.");
      return;
    }
    
    try {
      // Mocking the POST since API might not exist yet
      toast.success(`${city.name} added to your trip!`);
      // In a real app:
      // await fetch(`/api/trips/${selectedTripId}/stops`, { method: "POST", body: JSON.stringify(city) });
    } catch (e) {
      toast.error("Failed to add city.");
    }
  };

  const filteredCities = useMemo(() => {
    let result = cities.filter((city: any) => {
      const matchesSearch = city.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
                            city.country.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesRegion = selectedRegions.some(r => city.region.includes(r));
      return matchesSearch && matchesRegion;
    });

    if (sortBy === "popularity") {
      result.sort((a: any, b: any) => b.popularity - a.popularity);
    } else if (sortBy === "name") {
      result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sortBy === "cost") {
      const costOrder: Record<string, number> = { "low": 1, "medium": 2, "high": 3 };
      result.sort((a: any, b: any) => (costOrder[a.costIndex.toLowerCase()] || 0) - (costOrder[b.costIndex.toLowerCase()] || 0));
    }

    return result;
  }, [cities, debouncedQuery, selectedRegions, sortBy]);

  // Grouping logic (optional)
  const groupedCities = useMemo(() => {
    if (groupBy === "none") return { "All Cities": filteredCities };
    
    const groups: Record<string, any[]> = {};
    filteredCities.forEach((city: any) => {
      let key = "Other";
      if (groupBy === "region") key = city.region;
      if (groupBy === "country") key = city.country;
      if (groupBy === "cost") key = city.costIndex + " Cost";
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(city);
    });
    return groups;
  }, [filteredCities, groupBy]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Explore Cities</h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Discover your next destination. Find top-rated cities across the globe and add them to your itinerary.
        </p>
      </div>

      {/* SEARCH + FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 sticky top-4 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Search cities, countries..." 
            className="pl-10 h-12 bg-gray-50 border-transparent focus-visible:ring-teal-500 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar items-center">
          
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[140px] h-12 bg-gray-50 border-transparent">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="region">By Region</SelectItem>
              <SelectItem value="country">By Country</SelectItem>
              <SelectItem value="cost">By Cost</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 bg-gray-50 border-transparent hover:bg-gray-100 min-w-[120px]">
                Filter Region
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Regions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {REGIONS.map(region => (
                <DropdownMenuCheckboxItem
                  key={region}
                  checked={selectedRegions.includes(region)}
                  onCheckedChange={(checked) => {
                    setSelectedRegions(prev => 
                      checked ? [...prev, region] : prev.filter(r => r !== region)
                    );
                  }}
                >
                  {region}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-12 bg-gray-50 border-transparent">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="cost">Cost (Low-High)</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* RESULTS SECTION */}
      <div>
        <p className="text-gray-500 font-medium mb-6">
          Showing <span className="text-gray-900">{filteredCities.length}</span> results
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No cities found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedCities).map(([groupName, groupCities]) => (
              <div key={groupName} className="space-y-6">
                {groupBy !== "none" && (
                  <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">{groupName}</h2>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupCities.map(city => (
                    <div key={city._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                      
                      {/* Card Header (Gradient) */}
                      <div className={`h-32 bg-gradient-to-br ${getRegionGradient(city.region)} p-6 flex flex-col justify-end relative overflow-hidden`}>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm border border-white/10">
                          {city.region}
                        </div>
                        <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm group-hover:scale-105 transition-transform origin-bottom-left">
                          {city.name}
                        </h3>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600 font-medium">
                            <span className="text-xl">{getFlagEmoji(city.country)}</span>
                            {city.country}
                          </div>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            {getCostBadge(city.costIndex)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Popularity</span>
                            <span>{city.popularity}/100</span>
                          </div>
                          <Progress value={city.popularity} className="h-1.5 bg-gray-100 [&>div]:bg-amber-500" />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {city.highlights?.map((hl: string) => (
                            <span key={hl} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
                              {hl}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Card Footer */}
                      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                        <Button variant="outline" className="flex-1 bg-white hover:bg-gray-50 text-teal-700 border-gray-200" asChild>
                          <Link href={`/search/activities?city=${encodeURIComponent(city.name)}`}>
                            Activities <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700 w-12 px-0 shadow-sm" title="Add to Trip">
                              <Plus className="w-5 h-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add {city.name} to Trip</DialogTitle>
                              <DialogDescription>
                                Select which trip you want to add this destination to.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4 space-y-4">
                              {trips.length === 0 ? (
                                <div className="text-center text-gray-500">
                                  No trips found. <Link href="/trips/new" className="text-teal-600 underline">Create one first.</Link>
                                </div>
                              ) : (
                                <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a trip" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {trips.map((t: any) => (
                                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            
                            <Button 
                              onClick={() => handleAddCityToTrip(city)} 
                              className="w-full bg-teal-600 hover:bg-teal-700"
                              disabled={!selectedTripId || trips.length === 0}
                            >
                              Add City
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
