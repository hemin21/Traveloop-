"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { 
  Mail, Phone, MapPin, Settings, Camera, Lock, 
  Trash2, LogOut, ChevronDown, ChevronUp, Plus, X,
  Map, Calendar, ArrowRight, Plane
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    country: "",
    additionalInfo: "",
  });

  const { data: profileData, mutate: mutateProfile } = useSWR(user ? "/api/profile" : null, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  const { data: upcomingTripsData } = useSWR("/api/trips?status=upcoming&limit=3", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  const { data: completedTripsData } = useSWR("/api/trips?status=completed&limit=3", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  // Mock data fallbacks
  const mockProfile = { phone: "+1 234 567 8900", city: "San Francisco", country: "United States", additionalInfo: "Avid traveler, loves food and photography.", savedDestinations: ["Tokyo", "Paris", "Barcelona", "Kyoto"] };
  const profile = profileData || mockProfile;
  
  const mockUpcoming = [
    { _id: "trip1", name: "Summer in Europe", startDate: new Date(Date.now() + 864000000).toISOString(), endDate: new Date(Date.now() + 1728000000).toISOString() },
    { _id: "trip2", name: "Bali Retreat", startDate: new Date(Date.now() + 3000000000).toISOString(), endDate: new Date(Date.now() + 3500000000).toISOString() }
  ];
  const upcomingTrips = Array.isArray(upcomingTripsData) ? upcomingTripsData : (upcomingTripsData?.trips || mockUpcoming);

  const mockCompleted = [
    { _id: "trip3", name: "New York Weekend", startDate: new Date(Date.now() - 1728000000).toISOString(), endDate: new Date(Date.now() - 864000000).toISOString() }
  ];
  const completedTrips = Array.isArray(completedTripsData) ? completedTripsData : (completedTripsData?.trips || mockCompleted);

  // Sync state
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: profile.phone || "",
        city: profile.city || "",
        country: profile.country || "",
        additionalInfo: profile.additionalInfo || "",
      });
    }
  }, [user, profile, isEditing]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Directly update MongoDB profile via our API which now supports standard user fields

      // 2. Update MongoDB profile
      const res = await fetch("/api/profile", { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData) 
      });
      if (!res.ok) throw new Error("Failed to update DB");
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      mutateProfile(); // refetch
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      toast.success("Account deleted.");
      window.location.href = "/sign-in";
    } catch (e) {
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  };

  const [savedDestinations, setSavedDestinations] = useState(profile.savedDestinations || []);
  const removeDestination = (dest: string) => {
    setSavedDestinations(savedDestinations.filter(d => d !== dest));
    toast.success(`${dest} removed from saved destinations.`);
  };

  if (!isUserLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <Skeleton className="w-32 h-32 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const memberSince = user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "Unknown";
  const userAvatarUrl = user?.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* 1. TOP PROFILE SECTION */}
      <section className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          <Image 
            src={userAvatarUrl} 
            alt="User avatar" 
            width={128}
            height={128}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
          />
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-teal-600">12</span>
            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Trips Planned</span>
          </div>
          <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-amber-500">28</span>
            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Cities Visited</span>
          </div>
          <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-gray-700">{memberSince}</span>
            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Member Since</span>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-3 pt-4">
            <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
            <Button variant="outline" className="text-gray-700">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        )}
      </section>

      {/* 2. EDIT PROFILE FORM */}
      {isEditing && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Edit Profile</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={user?.primaryEmailAddress?.emailAddress} disabled className="pl-9 bg-gray-50 text-gray-500" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" placeholder="San Francisco" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Additional Info</label>
              <Textarea 
                placeholder="Tell us a bit about your travel style..." 
                className="min-h-[100px]"
                value={formData.additionalInfo}
                onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>
      )}

      {/* 3. PREPLANNED TRIPS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Preplanned Trips</h2>
          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none">{upcomingTrips.length}</Badge>
        </div>
        
        {upcomingTrips.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <Plane className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-700 font-medium">No upcoming trips</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">Start planning your next big adventure.</p>
            <Link href="/trips/new">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">Plan a Trip</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrips.map((trip: any, i: number) => (
              <div key={trip._id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className={`h-16 ${i%2===0 ? 'bg-gradient-to-r from-teal-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`} />
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{trip.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-50">
                    <Link href={`/trips/${trip._id}`} className="text-teal-600 text-sm font-medium flex items-center hover:text-teal-700 transition-colors">
                      View Itinerary <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. PREVIOUS TRIPS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Previous Trips</h2>
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none">{completedTrips.length}</Badge>
        </div>
        
        {completedTrips.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-gray-500">
            No completed trips yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTrips.map((trip: any) => (
              <div key={trip._id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden opacity-80">
                <div className="h-16 bg-gradient-to-r from-gray-400 to-gray-300 grayscale-[30%]" />
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{trip.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-50">
                    <Link href={`/trips/${trip._id}`} className="text-gray-600 text-sm font-medium flex items-center hover:text-gray-900 transition-colors">
                      View Memory <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. SAVED DESTINATIONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Saved Destinations</h2>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {savedDestinations.map((dest: string) => (
              <Badge key={dest} className="pl-3 pr-1 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-100 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600 mr-1" />
                {dest}
                <button 
                  onClick={() => removeDestination(dest)}
                  className="ml-1 p-0.5 rounded-full hover:bg-teal-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
            
            <Link href="/search/cities">
              <Button variant="outline" size="sm" className="h-8 border-dashed text-gray-500">
                <Plus className="w-4 h-4 mr-1" /> Save a Destination
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. DANGER ZONE */}
      <section className="pt-8 border-t border-gray-200">
        <div className="bg-red-50/50 border border-red-100 rounded-xl overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-4 text-left font-medium text-red-900 hover:bg-red-50 transition-colors"
            onClick={() => setShowDangerZone(!showDangerZone)}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-600" /> Account Settings
            </span>
            {showDangerZone ? <ChevronUp className="w-5 h-5 text-red-400" /> : <ChevronDown className="w-5 h-5 text-red-400" />}
          </button>
          
          {showDangerZone && (
            <div className="p-6 bg-white border-t border-red-100 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900">Sign Out</h4>
                  <p className="text-sm text-gray-500">Log out of your Traveloop account on this device.</p>
                </div>
                <Button variant="outline" className="text-gray-700" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
              
              <div className="h-px bg-gray-100" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-red-600">Delete Account</h4>
                  <p className="text-sm text-gray-500">Permanently delete your account and all associated trips.</p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Delete Account?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account, 
                        all your planned trips, saved destinations, and remove your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        Yes, delete my account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
