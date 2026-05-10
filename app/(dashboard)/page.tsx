"use client";

import React, { useState } from 'react';
import { useUser } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { Search, MapPin, Plus, ArrowRight, Calendar, Map as MapIcon, Globe, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SAMPLE_CITIES = [
  { name: 'Paris', country: 'France', image: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
  { name: 'Rome', country: 'Italy', image: 'bg-gradient-to-br from-orange-400 to-red-500' },
  { name: 'Tokyo', country: 'Japan', image: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { name: 'Bali', country: 'Indonesia', image: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
  { name: 'Barcelona', country: 'Spain', image: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
  { name: 'New York', country: 'USA', image: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  { name: 'Dubai', country: 'UAE', image: 'bg-gradient-to-br from-amber-500 to-yellow-600' },
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: recentTrips, error: tripsError, isLoading: tripsLoading } = useSWR('/api/trips?limit=3', fetcher);
  const { data: allTrips, isLoading: allTripsLoading } = useSWR('/api/trips', fetcher);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search/cities?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLoadDemoData = async () => {
    try {
      const toastId = toast.loading('Loading demo data...');
      const res = await fetch('/api/seed/user', { method: 'POST' });
      if (res.ok) {
        toast.success('Demo data loaded successfully!', { id: toastId });
        // Optionally trigger a re-validation of SWR cache here
      } else {
        toast.error('Failed to load demo data.', { id: toastId });
      }
    } catch (error) {
      toast.error('Error loading demo data.');
    }
  };

  // Calculate stats
  const tripsArray = Array.isArray(allTrips) ? allTrips : [];
  const totalTrips = tripsArray.length || 0;
  const upcomingTrips = tripsArray.filter((t: any) => t.status === 'upcoming').length || 0;
  
  // Naive calculation for unique cities across all trips
  let uniqueCities = 0;
  if (tripsArray.length > 0) {
    const cities = new Set<string>();
    tripsArray.forEach((trip: any) => {
      if (trip.stops && Array.isArray(trip.stops)) {
         trip.stops.forEach((stop: any) => {
             if (stop.city) cities.add(stop.city);
             else if (stop.name) cities.add(stop.name);
         });
      }
    });
    uniqueCities = cities.size || 0;
  }

  const recentTripsArray = Array.isArray(recentTrips) ? recentTrips : [];

  return (
    <div className="space-y-8 pb-16 relative min-h-[calc(100vh-100px)]">
      {/* Welcome Greeting */}
      <div className="flex items-center justify-between">
        {isLoaded && user && (
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome back, {user.firstName || user.username || 'Traveler'}!
          </h1>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <Button onClick={handleLoadDemoData} variant="outline" className="flex items-center gap-2">
            <Database size={16} />
            <span className="hidden sm:inline">Load Demo Data</span>
          </Button>
        )}
      </div>

      {/* 1. Hero Banner */}
      <section className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-gradient-to-r from-teal-600 to-teal-800 shadow-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        <div className="relative z-10 space-y-4 max-w-2xl w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Plan Your Next Adventure
          </h2>
          <p className="text-lg md:text-xl text-white/90 font-medium">
            Discover, plan, and share your perfect journey
          </p>
          
          <form onSubmit={handleSearch} className="mt-8 relative flex w-full max-w-xl mx-auto shadow-lg rounded-full overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 p-1">
            <Input 
              type="text" 
              placeholder="Search destinations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-white border-0 focus-visible:ring-0 text-gray-800 placeholder:text-gray-400 rounded-l-full h-12 px-6 text-lg"
            />
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white rounded-r-full rounded-l-none h-12 px-8 font-medium">
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* 4. Quick Stats Bar */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Trips</p>
                {allTripsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-teal-600">{totalTrips}</p>
                )}
              </div>
              <div className="p-3 bg-teal-50 rounded-full">
                <MapIcon className="w-6 h-6 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Trips</p>
                {allTripsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-amber-500">{upcomingTrips}</p>
                )}
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Cities Visited</p>
                {allTripsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-bold text-teal-600">{uniqueCities}</p>
                )}
              </div>
              <div className="p-3 bg-teal-50 rounded-full">
                <Globe className="w-6 h-6 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Top Regional Selections */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Top Regional Selections</h3>
          <Link href="/search/cities" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center">
            View all <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 gap-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {SAMPLE_CITIES.map((city) => (
            <div 
              key={city.name}
              onClick={() => router.push(`/search/cities?city=${encodeURIComponent(city.name)}`)}
              className={`relative flex-none w-[160px] h-[160px] rounded-xl overflow-hidden cursor-pointer group shadow-sm snap-start ${city.image}`}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
              <div className="absolute bottom-4 left-4 z-20">
                <p className="text-white font-bold text-lg leading-tight">{city.name}</p>
                <p className="text-white/80 text-sm font-medium flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {city.country}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Previous Trips */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Your Recent Trips</h3>
          <Link href="/trips" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center">
            View all <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        {tripsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : tripsError ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <p>Failed to load recent trips.</p>
            </CardContent>
          </Card>
        ) : recentTripsArray.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentTripsArray.map((trip: any) => (
              <Card key={trip._id || trip.id || Math.random()} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-none shadow-sm" onClick={() => router.push(`/trips/${trip._id || trip.id}`)}>
                <div className="h-32 bg-gradient-to-r from-teal-400 to-amber-300 relative">
                  <div className="absolute top-3 right-3">
                    <Badge className={
                      trip.status === 'upcoming' ? 'bg-blue-500 hover:bg-blue-600' :
                      trip.status === 'ongoing' ? 'bg-green-500 hover:bg-green-600' :
                      'bg-gray-500 hover:bg-gray-600'
                    }>
                      {trip.status ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1) : 'Planned'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h4 className="font-bold text-lg text-gray-800 truncate mb-1">{trip.title || 'Untitled Trip'}</h4>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    <span>
                      {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'} 
                      {trip.endDate ? ` - ${new Date(trip.endDate).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-teal-600">
                    <MapIcon className="w-4 h-4 mr-1.5" />
                    <span>{trip.stops?.length || 0} Cities / Stops</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-teal-200 bg-teal-50/50 shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600">
                <MapIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">No trips yet!</h4>
              <p className="text-gray-500 mb-6 max-w-sm">
                Your adventure awaits. Start planning your first perfect journey today.
              </p>
              <Button onClick={() => router.push('/trips/new')} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 rounded-full">
                Plan your first trip
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 5. Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50 group">
        <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block bg-gray-800 text-white text-sm font-medium py-1 px-3 rounded shadow-lg whitespace-nowrap">
          Plan a Trip
        </div>
        <button
          onClick={() => router.push('/trips/new')}
          className="flex items-center justify-center w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-teal-600/30"
          aria-label="Plan a Trip"
        >
          <Plus size={28} />
        </button>
      </div>

    </div>
  );
}
