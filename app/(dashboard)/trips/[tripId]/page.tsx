"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  format, parseISO, differenceInDays, isSameDay, eachDayOfInterval, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, 
  isWithinInterval, addMonths, subMonths
} from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { 
  MapPin, Calendar as CalendarIcon, Clock, Edit2, Share2, Download, 
  MoreVertical, CheckSquare, FileText, Receipt, UserPlus,
  Car, Bed, Utensils, Ticket, Landmark, ChevronLeft, ChevronRight, Activity, Circle
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Types ---
interface TripActivity {
  _id: string;
  type: string;
  name: string;
  startTime: string;
  cost: number;
  duration: number; // in minutes
}

interface TripStop {
  _id: string;
  cityName: string;
  country: string;
  startDate: string;
  endDate: string;
  budget: number;
  activities: TripActivity[];
}

interface Trip {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  isPublic?: boolean;
}

// --- Fetcher & Fallbacks ---
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch");
  }
  return res.json();
};

const MOCK_TRIP: Trip = {
  _id: "mock",
  name: "Amazing European Adventure",
  startDate: new Date().toISOString(),
  endDate: addDays(new Date(), 8).toISOString(),
  budget: 6500,
};

const MOCK_STOPS: TripStop[] = [
  {
    _id: "stop1",
    cityName: "Paris",
    country: "France",
    startDate: new Date().toISOString(),
    endDate: addDays(new Date(), 3).toISOString(),
    budget: 2500,
    activities: [
      { _id: "a1", type: "Landmark", name: "Eiffel Tower Summit", startTime: "10:00", cost: 35, duration: 120 },
      { _id: "a2", type: "Utensils", name: "Dinner at Le Jules Verne", startTime: "19:00", cost: 250, duration: 180 },
    ]
  },
  {
    _id: "stop2",
    cityName: "Rome",
    country: "Italy",
    startDate: addDays(new Date(), 4).toISOString(),
    endDate: addDays(new Date(), 8).toISOString(),
    budget: 2000,
    activities: [
      { _id: "a3", type: "Ticket", name: "Colosseum & Forum Tour", startTime: "09:00", cost: 65, duration: 180 },
      { _id: "a4", type: "Transport", name: "Train to Naples", startTime: "14:00", cost: 45, duration: 90 },
    ]
  }
];

const COLORS = {
  Transport: "#3b82f6", // blue-500
  Hotel: "#a855f7", // purple-500
  Food: "#f97316", // orange-500
  Activities: "#14b8a6", // teal-500
  Other: "#9ca3af", // gray-400
};

const getActivityIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'transport': return <Car className="w-4 h-4 text-blue-500" />;
    case 'hotel':
    case 'accommodation': return <Bed className="w-4 h-4 text-purple-500" />;
    case 'food':
    case 'utensils': return <Utensils className="w-4 h-4 text-orange-500" />;
    case 'ticket':
    case 'activity': return <Ticket className="w-4 h-4 text-teal-500" />;
    case 'landmark': return <Landmark className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'transport': return COLORS.Transport;
    case 'hotel':
    case 'accommodation': return COLORS.Hotel;
    case 'food':
    case 'utensils': return COLORS.Food;
    case 'ticket':
    case 'activity': return COLORS.Activities;
    default: return COLORS.Other;
  }
};

export default function TripViewPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data fetching
  const { data: tripData, isLoading: isTripLoading } = useSWR(`/api/trips/${tripId}`, fetcher);
  const { data: stopsData, isLoading: isStopsLoading } = useSWR(`/api/trips/${tripId}/stops`, fetcher);

  // Determine if using mock data (for preview when API isn't built yet)
  const isMock = !isTripLoading && !tripData;
  const trip: Trip = isMock ? MOCK_TRIP : (tripData?.trip || tripData);
  const stops: TripStop[] = isMock ? MOCK_STOPS : (stopsData?.stops || stopsData || []);

  const isLoading = isTripLoading || isStopsLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-4">
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-full h-64 rounded-xl" />
            <Skeleton className="w-full h-64 rounded-xl" />
          </div>
          <div className="lg:w-1/3 space-y-6">
            <Skeleton className="w-full h-80 rounded-xl" />
            <Skeleton className="w-full h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return <div className="p-8 text-center text-gray-500">Trip not found.</div>;
  }

  // --- Derived Data ---
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const totalCities = stops.length;
  
  // Flatten activities
  const allActivities = stops.flatMap(stop => stop.activities || []);
  const totalActivities = allActivities.length;
  const totalSpent = allActivities.reduce((acc, act) => acc + (Number(act.cost) || 0), 0);
  
  // Group spending by category for PieChart
  const spendingByCategory = allActivities.reduce((acc: any, act) => {
    let category = "Other";
    const type = act.type?.toLowerCase();
    if (['transport'].includes(type)) category = "Transport";
    else if (['hotel', 'accommodation'].includes(type)) category = "Hotel";
    else if (['food', 'utensils'].includes(type)) category = "Food";
    else if (['ticket', 'activity', 'landmark'].includes(type)) category = "Activities";
    
    if (!acc[category]) acc[category] = 0;
    acc[category] += Number(act.cost) || 0;
    return acc;
  }, {});

  const pieData = Object.keys(spendingByCategory).map(key => ({
    name: key,
    value: spendingByCategory[key]
  }));

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // --- Calendar Helpers ---
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart);
    const endDateGrid = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDateGrid;
    let formattedDate = "";

    // Header row (Sun, Mon, ...)
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    while (day <= endDateGrid) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Is this day part of the trip?
        const isTripDay = isWithinInterval(day, { start: startOfDay(startDate), end: endOfDay(endDate) });
        
        // Does this day have activities?
        const dayActivities = allActivities.filter(act => {
          // In a real app, activities would have exact dates. 
          // For now, we simulate by checking which stop covers this day.
          const stop = stops.find(s => isWithinInterval(cloneDay, { 
            start: startOfDay(parseISO(s.startDate)), 
            end: endOfDay(parseISO(s.endDate)) 
          }));
          return stop?.activities.includes(act);
        });

        days.push(
          <div
            key={day.toISOString()}
            className={`min-h-[80px] p-2 border border-gray-100 ${
              !isSameMonth(day, monthStart) ? "bg-gray-50 text-gray-400" :
              isTripDay ? "bg-teal-50" : "bg-white"
            } transition-colors`}
          >
            <div className={`font-medium text-sm flex justify-between items-start ${isSameDay(day, new Date()) ? 'text-teal-600 font-bold' : ''}`}>
              <span>{formattedDate}</span>
            </div>
            
            {dayActivities.length > 0 && isTripDay && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="mt-2 cursor-pointer flex flex-wrap gap-1">
                    {dayActivities.map((act, idx) => (
                      <div key={idx} className="w-2 h-2 rounded-full" style={{ backgroundColor: getActivityColor(act.type) }} />
                    ))}
                    <div className="text-[10px] text-teal-700 w-full hover:underline">{dayActivities.length} activities</div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <h4 className="font-semibold text-sm mb-2">{format(cloneDay, "MMM d, yyyy")}</h4>
                  <div className="space-y-2">
                    {dayActivities.map(act => (
                      <div key={act._id} className="flex items-center gap-2 text-sm border-b pb-1 last:border-0">
                        {getActivityIcon(act.type)}
                        <div className="flex-1 truncate">{act.name}</div>
                        <div className="text-gray-500">{act.startTime}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-bold text-lg text-gray-800">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {daysOfWeek.map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* PAGE HEADER */}
      <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm">
        {/* Cover Image Placeholder (Gradient) */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-teal-500" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{trip.name}</h1>
            <div className="flex items-center text-white/90 gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{format(startDate, "MMMM d, yyyy")} — {format(endDate, "MMMM d, yyyy")}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                Ongoing
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                {totalCities} {totalCities === 1 ? 'City' : 'Cities'}
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                {totalDays} Days
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                {totalActivities} Activities
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-white text-teal-700 hover:bg-gray-100" asChild>
                <Link href={`/trips/${tripId}/build`}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Trip
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm px-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/trips/${tripId}/notes`)}>
                    <FileText className="w-4 h-4 mr-2" /> Trip Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/trips/${tripId}/checklist`)}>
                    <CheckSquare className="w-4 h-4 mr-2" /> Packing Checklist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/trips/${tripId}/invoice`)}>
                    <Receipt className="w-4 h-4 mr-2" /> Expense Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" /> Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: ITINERARY */}
        <div className="lg:w-2/3 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Itinerary</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                📋 List View
              </button>
              <button 
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                📅 Calendar View
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="space-y-8">
              {stops.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">No stops added yet.</p>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link href={`/trips/${tripId}/build`}>Add Your First Stop</Link>
                  </Button>
                </div>
              ) : (
                stops.map((stop, stopIndex) => (
                  <div key={stop._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Stop Header */}
                    <div className="bg-teal-50/50 p-5 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-teal-100 rounded-lg shrink-0 mt-1 sm:mt-0">
                            <MapPin className="w-5 h-5 text-teal-700" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">📍 {stop.cityName}, {stop.country}</h3>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(stop.startDate), "MMM d")} — {format(parseISO(stop.endDate), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        {stop.budget > 0 && (
                          <div className="text-sm font-medium text-teal-700 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-teal-100 self-start sm:self-auto">
                            Budget: ${stop.budget.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="p-5">
                      {(!stop.activities || stop.activities.length === 0) ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-3">No activities added yet</p>
                          <Link href={`/trips/${tripId}/build`} className="text-teal-600 font-medium hover:underline">
                            + Add Activities
                          </Link>
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-gray-200 before:-z-10 before:border-l-2 before:border-dashed before:border-gray-200">
                          {/* Note: in a real app, activities would be grouped by day. Here we just list them vertically */}
                          {stop.activities.map((act, i) => (
                            <div key={act._id} className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-[30px] top-3 w-3 h-3 rounded-full bg-white border-2 border-teal-500" />
                              
                              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-md shrink-0">
                                      {getActivityIcon(act.type)}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800">{act.name}</h4>
                                      <div className="flex items-center text-xs text-gray-500 gap-3 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          {act.startTime} ({act.duration} mins)
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Circle className="w-1 h-1 fill-gray-400" />
                                          {act.type}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {act.cost > 0 && (
                                    <div className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-md text-sm self-start sm:self-auto">
                                      ${act.cost.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Calendar View
            renderCalendar()
          )}
        </div>

        {/* RIGHT COLUMN: BUDGET & EXTRAS */}
        <div className="lg:w-1/3 space-y-6">
          
          {/* Budget Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-500" /> Budget Insights
            </h3>
            
            {pieData.length > 0 ? (
              <div className="h-48 relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-500">Total Spent</span>
                  <span className="font-bold text-gray-800">${totalSpent.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-6 border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No expenses logged yet</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-lg font-semibold text-gray-800">${trip.budget?.toLocaleString() || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className={`text-lg font-semibold ${trip.budget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(trip.budget - totalSpent).toLocaleString()}
                    {trip.budget - totalSpent < 0 && ' ⚠️'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Progress value={Math.min((totalSpent / (trip.budget || 1)) * 100, 100)} className="h-2 bg-gray-100" />
                <p className="text-xs text-gray-500 text-right">
                  {((totalSpent / (trip.budget || 1)) * 100).toFixed(1)}% used
                </p>
              </div>

              <Button variant="outline" className="w-full text-teal-700 hover:bg-teal-50 border-teal-200" asChild>
                <Link href={`/trips/${tripId}/invoice`}>
                  View Full Invoice
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-teal-700 hover:bg-teal-50" asChild>
                <Link href={`/trips/${tripId}/notes`}>
                  <FileText className="w-4 h-4 mr-3" /> Trip Notes
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-teal-700 hover:bg-teal-50" asChild>
                <Link href={`/trips/${tripId}/checklist`}>
                  <CheckSquare className="w-4 h-4 mr-3" /> Packing Checklist
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-teal-700 hover:bg-teal-50" asChild>
                <Link href={`/trips/${tripId}/invoice`}>
                  <Receipt className="w-4 h-4 mr-3" /> Expense Invoice
                </Link>
              </Button>
            </div>
          </div>

          {/* Collaborators */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Collaborators</h3>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <Avatar className="border-2 border-white w-10 h-10">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
              </div>
              <Button variant="outline" size="sm" className="ml-auto text-gray-600">
                <UserPlus className="w-4 h-4 mr-2" /> Invite
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
