"use client";

import { useState } from "react";
import { useUser } from "@/components/AuthProvider";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isBefore, isAfter, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { toast } from "react-hot-toast";
import { 
  Map, Plus, Search, Calendar, MapPin, Eye, Edit2, Trash2, Share2, Compass 
} from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Trip {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  tripType: string;
  isPublic?: boolean;
  budget?: number;
  stops?: any[];
  updatedAt: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return []; // Fallback for unimplemented API
    throw new Error("Failed to fetch trips");
  }
  return res.json();
};

export default function MyTripsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  
  // Note: Expecting API to return an array of Trips or an object { trips: Trip[] }
  const { data, error, isLoading, mutate } = useSWR(
    isLoaded && isSignedIn ? "/api/trips" : null,
    fetcher
  );

  const handleDelete = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete trip");
      toast.success("Trip deleted successfully");
      mutate(); // Re-fetch list
    } catch (error) {
      toast.error("Could not delete trip");
    }
  };

  const handleShare = (tripId: string) => {
    const url = `${window.location.origin}/trips/${tripId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Extract trips safely
  const trips: Trip[] = Array.isArray(data) ? data : data?.trips || [];

  // Client-side Filtering
  let filteredTrips = trips.filter((trip) => 
    (trip.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side Sorting
  if (sortBy === "recent") {
    filteredTrips = filteredTrips.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  } else if (sortBy === "dateAsc") {
    filteredTrips = filteredTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } else if (sortBy === "name") {
    filteredTrips = filteredTrips.sort((a, b) => a.name.localeCompare(b.name));
  }

  const todayStart = startOfDay(new Date());
  
  // Categorize based on dates
  const ongoingTrips = filteredTrips.filter((trip) => {
    if (!trip.startDate || !trip.endDate) return false;
    const start = startOfDay(parseISO(trip.startDate));
    const end = endOfDay(parseISO(trip.endDate));
    return isWithinInterval(todayStart, { start, end });
  });

  const upcomingTrips = filteredTrips.filter((trip) => {
    if (!trip.startDate) return false;
    const start = startOfDay(parseISO(trip.startDate));
    return isAfter(start, todayStart);
  });

  const completedTrips = filteredTrips.filter((trip) => {
    if (!trip.endDate) return false;
    const end = endOfDay(parseISO(trip.endDate));
    return isBefore(end, todayStart);
  });

  const TripCard = ({ trip, status, colorClass }: { trip: Trip, status: string, colorClass: string }) => {
    const start = trip.startDate ? parseISO(trip.startDate) : new Date();
    const end = trip.endDate ? parseISO(trip.endDate) : new Date();
    const isPublic = trip.isPublic;

    return (
      <div className="relative flex flex-col sm:flex-row bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
        {/* Color bar */}
        <div className={`w-1 hidden sm:block ${colorClass}`} />
        <div className={`h-1 w-full sm:hidden ${colorClass}`} />
        
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800">{trip.name || "Untitled Trip"}</h3>
            <Badge variant="secondary" className={`${colorClass.replace("bg-", "text-").replace("500", "700").replace("400", "600")} bg-gray-50 self-start sm:self-auto`}>
              {status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{format(start, "MMM d, yyyy")} - {format(end, "MMM d, yyyy")}</span>
            </div>
            {trip.stops && trip.stops.length > 0 && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{trip.stops.length} {trip.stops.length === 1 ? 'city' : 'cities'}</span>
              </div>
            )}
            {trip.budget !== undefined && trip.budget > 0 && (
              <div className="flex items-center gap-1.5 text-green-600 font-medium">
                <span>Budget: ${trip.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 mt-auto pt-2">
            Last updated: {trip.updatedAt ? format(new Date(trip.updatedAt), "MMM d, yyyy h:mm a") : "Unknown"}
          </div>
        </div>

        <div className="bg-gray-50 p-3 sm:p-5 flex flex-row sm:flex-col items-center justify-end sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/trips/${trip._id}`)} title="View Trip" className="text-gray-500 hover:text-teal-600 hover:bg-teal-50">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/trips/${trip._id}/build`)} title="Edit Itinerary" className="text-gray-500 hover:text-amber-600 hover:bg-amber-50">
            <Edit2 className="w-4 h-4" />
          </Button>
          {isPublic && (
            <Button variant="ghost" size="icon" onClick={() => handleShare(trip._id)} title="Share Public Link" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50">
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Delete Trip" className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete '{trip.name}'? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(trip._id)} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  if (trips.length === 0 && !searchTerm && !isLoading && isLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-4">
          <Compass className="w-12 h-12 text-teal-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">No trips yet!</h2>
          <p className="text-gray-500 text-lg">Start planning your first adventure.</p>
        </div>
        <Button size="lg" className="bg-teal-600 hover:bg-teal-700 mt-4" asChild>
          <Link href="/trips/new">
            <Plus className="w-5 h-5 mr-2" />
            Plan Your First Trip
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Map className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">My Trips</h1>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto" asChild>
          <Link href="/trips/new">
            <Plus className="w-4 h-4 mr-2" />
            Plan New Trip
          </Link>
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search my trips..." 
            className="pl-9 bg-gray-50 border-transparent focus-visible:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[160px] bg-gray-50 border-transparent">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="dateAsc">Trip Date (Earliest)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center">
          Failed to load trips. Please try again later.
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Ongoing Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <h2 className="text-xl font-bold text-gray-700">Ongoing</h2>
            </div>
            {ongoingTrips.length === 0 ? (
              <p className="text-gray-500 italic py-2 pl-4 border-l-2 border-gray-100">No ongoing trips</p>
            ) : (
              <div className="grid gap-4">
                {ongoingTrips.map(trip => (
                  <TripCard key={trip._id} trip={trip} status="Ongoing" colorClass="bg-green-500" />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-xl font-bold text-gray-700">Upcoming</h2>
            </div>
            {upcomingTrips.length === 0 ? (
              <p className="text-gray-500 italic py-2 pl-4 border-l-2 border-gray-100">
                No upcoming trips &mdash; <Link href="/trips/new" className="text-teal-600 hover:underline">Plan one!</Link>
              </p>
            ) : (
              <div className="grid gap-4">
                {upcomingTrips.map(trip => (
                  <TripCard key={trip._id} trip={trip} status="Upcoming" colorClass="bg-blue-500" />
                ))}
              </div>
            )}
          </section>

          {/* Completed Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <h2 className="text-xl font-bold text-gray-700">Completed</h2>
            </div>
            {completedTrips.length === 0 ? (
              <p className="text-gray-500 italic py-2 pl-4 border-l-2 border-gray-100">No completed trips yet</p>
            ) : (
              <div className="grid gap-4">
                {completedTrips.map(trip => (
                  <TripCard key={trip._id} trip={trip} status="Completed" colorClass="bg-gray-400" />
                ))}
              </div>
            )}
          </section>
          
        </div>
      )}
    </div>
  );
}
