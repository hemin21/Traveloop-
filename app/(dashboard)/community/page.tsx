"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { useUser } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { 
  Users, Search, Heart, Copy, Share2, MessageCircle, 
  MapPin, Camera, PlaneTakeoff, Info, ArrowRight, ChevronDown, Check
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function CommunityPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterTripType, setFilterTripType] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Post Trip dialog state
  const [selectedTripToShare, setSelectedTripToShare] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch data
  const { data: communityData, isLoading } = useSWR("/api/community?page=1&limit=20", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  
  // User's trips for sharing
  const { data: myTripsData } = useSWR(isSignedIn ? "/api/trips" : null, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mock Data Fallbacks
  const mockPosts = [
    {
      _id: "post1",
      user: { name: "Alex Johnson", initials: "AJ", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      trip: {
        _id: "trip101",
        title: "Backpacking across Western Europe",
        route: ["Paris", "Amsterdam", "Berlin"],
        startDate: new Date(Date.now() - 864000000).toISOString(),
        endDate: new Date(Date.now() + 864000000).toISOString(),
        durationDays: 20,
        budget: "$2,500",
        tags: ["Solo", "Europe", "Adventure", "Budget"],
        region: "Europe",
        tripType: "Solo"
      },
      likes: 124,
      isLikedByMe: false,
      comments: 18,
      copies: 45
    },
    {
      _id: "post2",
      user: { name: "Sarah & Family", initials: "SF", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      trip: {
        _id: "trip102",
        title: "Tropical Bali Escape",
        route: ["Ubud", "Canggu", "Uluwatu"],
        startDate: new Date(Date.now() + 1728000000).toISOString(),
        endDate: new Date(Date.now() + 2592000000).toISOString(),
        durationDays: 10,
        budget: "$4,000",
        tags: ["Family", "Asia", "Relaxation", "Beach"],
        region: "Asia",
        tripType: "Family"
      },
      likes: 89,
      isLikedByMe: true,
      comments: 5,
      copies: 12
    },
    {
      _id: "post3",
      user: { name: "Mike Davis", initials: "MD", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      trip: {
        _id: "trip103",
        title: "Weekend in New York",
        route: ["New York City"],
        startDate: new Date(Date.now() - 10000000).toISOString(),
        endDate: new Date(Date.now() + 10000000).toISOString(),
        durationDays: 3,
        budget: "$800",
        tags: ["Group", "Americas", "Sightseeing", "Food"],
        region: "Americas",
        tripType: "Group"
      },
      likes: 230,
      isLikedByMe: false,
      comments: 42,
      copies: 88
    }
  ];

  const rawPosts = communityData?.posts || (Array.isArray(communityData) ? communityData : mockPosts);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (rawPosts.length > 0) setPosts(rawPosts);
  }, [rawPosts]);

  const mockMyTrips = [
    { _id: "my1", name: "Tokyo Spring 2026", isPublic: false },
    { _id: "my2", name: "London Business Trip", isPublic: true },
  ];
  const myTrips = myTripsData?.trips || mockMyTrips;

  // Actions
  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!isSignedIn) {
      toast("Please sign in to like trips.", { icon: "🔒" });
      router.push("/sign-in");
      return;
    }
    
    // Optimistic UI Update
    setPosts(posts.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          isLikedByMe: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1
        };
      }
      return p;
    }));

    try {
      const response = await fetch(`/api/community/${postId}/like`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to like");
    } catch (err) {
      // Rollback on error
      setPosts(posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            isLikedByMe: currentlyLiked,
            likes: currentlyLiked ? p.likes : Math.max(0, p.likes - 1)
          };
        }
        return p;
      }));
      toast.error("Error recording like. Try again.");
    }
  };

  const handleCopyTrip = async (tripId: string, title: string) => {
    if (!isSignedIn) {
      toast("Sign in to copy this trip to your account.", { icon: "🔒" });
      router.push("/sign-in");
      return;
    }

    const loadToast = toast.loading(`Cloning "${title}" to your account...`);

    try {
      const res = await fetch('/api/trips', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyFrom: tripId }) 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to copy trip");
      }
      const newTrip = await res.json();
      
      toast.success(`"${title}" copied successfully!`, { id: loadToast });
      
      router.push(`/trips/${newTrip._id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to copy this trip.", { id: loadToast });
    }
  };

  const handleSharePost = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/community/${id}`);
    toast.success("Link copied to clipboard!");
  };

  const handleShareMyTrip = async () => {
    if (!selectedTripToShare) return;
    const selected = myTrips.find(t => t._id === selectedTripToShare);
    if (selected && !selected.isPublic) {
      toast.error("Trip must be marked as public in settings first.");
      return;
    }

    const loadingId = toast.loading("Sharing trip with community...");

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tripId: selectedTripToShare, 
          content: `Sharing my ${selected.name} itinerary!`,
          region: "Europe", // Defaults for this flow, you can expand to manual inputs
          tripType: "Group",
          tags: ["Travel", "Itinerary"]
        })
      });
      
      if (!res.ok) throw new Error("Failed to post.");
      
      toast.success("Trip shared with the community!", { id: loadingId });
      setIsShareDialogOpen(false);
      window.location.reload(); // Quick refresh to see new post
    } catch (err) {
      toast.error("Failed to share trip.", { id: loadingId });
    }
  };

  // Filtering & Sorting
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Filter Search
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(p => 
        p.trip.title.toLowerCase().includes(q) || 
        p.trip.route.some((city: string) => city.toLowerCase().includes(q)) ||
        p.user.name.toLowerCase().includes(q) ||
        p.trip.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    // Filter Region
    if (filterRegion !== "all") {
      result = result.filter(p => p.trip.region === filterRegion);
    }

    // Filter Trip Type
    if (filterTripType !== "all") {
      result = result.filter(p => p.trip.tripType === filterTripType);
    }

    // Sorting
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "most-liked") {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "most-copied") {
      result.sort((a, b) => b.copies - a.copies);
    } else if (sortBy === "shortest") {
      result.sort((a, b) => a.trip.durationDays - b.trip.durationDays);
    } else if (sortBy === "longest") {
      result.sort((a, b) => b.trip.durationDays - a.trip.durationDays);
    }

    return result;
  }, [posts, debouncedQuery, filterRegion, filterTripType, sortBy]);

  // Grouping
  const groupedPosts = useMemo(() => {
    if (groupBy === "none") return { "All": filteredAndSortedPosts };
    
    const groups: Record<string, any[]> = {};
    filteredAndSortedPosts.forEach(post => {
      let key = "Other";
      if (groupBy === "region") key = post.trip.region || "Other";
      if (groupBy === "tripType") key = post.trip.tripType || "Other";
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    return groups;
  }, [filteredAndSortedPosts, groupBy]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2.5 rounded-xl">
              <Users className="w-7 h-7 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Travel Community</h1>
          </div>
          <p className="text-gray-500 text-lg">Get inspired by fellow travelers</p>
        </div>
      </div>

      {/* ANNOTATION NOTE */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
        <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <p>
          <strong>Community section</strong> where all the users can share their experiences about a certain trip or activity. 
          Using the search, group by, filter and sort by options, the user can narrow down the result they are looking for.
        </p>
      </div>

      {/* POST YOUR TRIP SECTION */}
      {isLoaded && isSignedIn && (
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 shadow-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <PlaneTakeoff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Share your trip plan with the community</h3>
              <p className="text-teal-100 mt-1">Help others discover amazing routes and experiences.</p>
            </div>
          </div>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-teal-700 hover:bg-teal-50 shrink-0 shadow-sm border-none font-bold">
                Share a Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Trip to Community</DialogTitle>
                <DialogDescription>
                  Select one of your trips to post publicly. It will be visible to everyone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <Select value={selectedTripToShare} onValueChange={setSelectedTripToShare}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a trip..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myTrips.map(t => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name} {t.isPublic ? "🌍" : "🔒"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTripToShare && myTrips.find(t => t._id === selectedTripToShare)?.isPublic === false && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md flex items-center gap-2 border border-amber-200">
                    <Info className="w-4 h-4" /> You must mark this trip as public in its settings before sharing.
                  </p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleShareMyTrip}>
                  Post to Community
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 sticky top-4 z-10">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search trips, cities, tags..." 
            className="pl-9 h-10 bg-gray-50 border-transparent focus-visible:ring-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter: Region */}
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-10 bg-gray-50 border-transparent">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="Americas">Americas</SelectItem>
              <SelectItem value="Africa">Africa</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter: Trip Type */}
          <Select value={filterTripType} onValueChange={setFilterTripType}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-10 bg-gray-50 border-transparent">
              <SelectValue placeholder="Trip Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Solo">Solo</SelectItem>
              <SelectItem value="Group">Group</SelectItem>
              <SelectItem value="Family">Family</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
            </SelectContent>
          </Select>

          {/* Group By */}
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-10 bg-gray-50 border-transparent text-gray-600">
              <span className="text-gray-400 mr-1 hidden sm:inline">Group:</span>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="tripType">Trip Type</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-10 bg-gray-50 border-transparent text-gray-600">
              <span className="text-gray-400 mr-1 hidden sm:inline">Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
              <SelectItem value="most-copied">Most Copied</SelectItem>
              <SelectItem value="shortest">Shortest</SelectItem>
              <SelectItem value="longest">Longest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* COMMUNITY FEED */}
      {isLoading && posts.length === 0 ? (
        <div className="space-y-6">
          {[1,2,3].map(i => <Skeleton key={i} className="w-full h-72 rounded-2xl" />)}
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No trips shared yet</h3>
          <p className="text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
            Try adjusting your filters, or be the first to share an amazing itinerary!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedPosts).map(groupName => (
            <div key={groupName} className="space-y-6">
              {groupBy !== "none" && (
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mt-4">
                  {groupName}
                </h2>
              )}
              
              <div className="space-y-6">
                {groupedPosts[groupName].map((post: any) => (
                  <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Post Header */}
                    <div className="p-4 sm:p-5 flex items-center gap-3">
                      <Image 
                        src={post.user.avatar} 
                        alt={post.user.name} 
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                      />
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{post.user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          shared a trip plan • {formatDistanceToNow(new Date(post.createdAt))} ago
                        </p>
                      </div>
                    </div>

                    {/* Trip Preview Box */}
                    <div className="px-4 sm:px-5 pb-5">
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                            {post.trip.title}
                          </h3>
                          {post.trip.budget && (
                            <Badge className="bg-white text-gray-700 border-gray-200 shadow-sm shrink-0 w-fit">
                              Budget: {post.trip.budget}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-gray-600 font-medium text-sm">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {post.trip.route.map((city: string, i: number) => (
                            <span key={i} className="flex items-center">
                              {city} {i < post.trip.route.length - 1 && <ArrowRight className="w-3.5 h-3.5 mx-1.5 text-gray-400" />}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{format(new Date(post.trip.startDate), "MMM d")} - {format(new Date(post.trip.endDate), "MMM d, yyyy")}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span>{post.trip.durationDays} days</span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.trip.tags.map((tag: string) => (
                            <Badge key={tag} className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-none font-semibold">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-gray-50/50 px-4 sm:px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button 
                          onClick={() => handleLike(post._id, post.isLikedByMe)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors font-medium text-sm ${post.isLikedByMe ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLikedByMe ? 'fill-current' : ''}`} />
                          {post.likes}
                        </button>
                        
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 text-sm font-medium">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments}
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 text-sm font-medium">
                          <Copy className="w-4 h-4" />
                          {post.copies}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleSharePost(post._id)}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                          title="Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        <Button 
                          onClick={() => handleCopyTrip(post.trip._id, post.trip.title)}
                          size="sm" 
                          className="bg-teal-600 hover:bg-teal-700 shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Trip
                        </Button>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-6 pb-2 text-center">
            <Button variant="outline" className="border-gray-200 text-gray-600 w-full sm:w-auto">
              Load more posts
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
}
