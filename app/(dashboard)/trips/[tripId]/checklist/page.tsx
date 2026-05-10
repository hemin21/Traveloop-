"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckSquare, Check, X as XIcon, Share2, Plus, RefreshCw, ChevronDown, CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const defaultItems = [
  { id: "1", name: "Passport", category: "Documents", isPacked: false },
  { id: "2", name: "Flight Tickets (printed)", category: "Documents", isPacked: false },
  { id: "3", name: "Travel Insurance", category: "Documents", isPacked: false },
  { id: "4", name: "Hotel Booking Confirmation", category: "Documents", isPacked: false },
  { id: "5", name: "Casual Shirts", category: "Clothing", isPacked: false },
  { id: "6", name: "Trousers / Jeans", category: "Clothing", isPacked: false },
  { id: "7", name: "Comfortable Walking Shoes", category: "Clothing", isPacked: false },
  { id: "8", name: "Light Jacket / Windbreaker", category: "Clothing", isPacked: false },
  { id: "9", name: "Phone Charger", category: "Electronics", isPacked: false },
  { id: "10", name: "Universal Power Adapter", category: "Electronics", isPacked: false },
  { id: "11", name: "Earphone / Headphones", category: "Electronics", isPacked: false },
];

const ALL_CATEGORIES = ["Documents", "Clothing", "Electronics", "Toiletries", "Other"];

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const addInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Fetch trips for the dropdown
  const { data: tripsData } = useSWR("/api/trips", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  
  // Fetch current trip info
  const { data: tripData } = useSWR(`/api/trips/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  // Fetch packing items
  const { data: packingData, isLoading: isLoadingPacking } = useSWR(`/api/packing/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  // Mock fallbacks
  const mockTrips = [
    { _id: "trip1", name: "Paris & Rome Adventure" },
    { _id: "trip2", name: "Bali Summer Retreat" },
  ];
  const trips = tripsData?.trips || (Array.isArray(tripsData) ? tripsData : mockTrips);
  
  const currentTrip = trips.find((t: any) => t._id === tripId) || tripData || { _id: tripId, title: "Paris & Rome Adventure" };
  const tripName = currentTrip.title || currentTrip.name || "Unknown Trip";

  // Initialize items state
  useEffect(() => {
    if (packingData && packingData.items) {
      setItems(packingData.items);
    }
  }, [packingData, isLoadingPacking]);

  // Derived state
  const totalItems = items.length;
  const packedItems = items.filter(i => i.isPacked).length;
  const progressPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    ALL_CATEGORIES.forEach(c => groups[c] = []);
    
    items.forEach(item => {
      const cat = ALL_CATEGORIES.includes(item.category) ? item.category : "Other";
      groups[cat].push(item);
    });
    
    return groups;
  }, [items]);

  // Actions
  const toggleItem = async (id: string, isPacked: boolean) => {
    // Optimistic UI update
    setItems(prev => prev.map(item => item.id === id ? { ...item, isPacked } : item));
    
    try {
      await fetch(`/api/packing/${tripId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, isPacked }) 
      });
    } catch (e) {
      toast.error("Failed to update item.");
      setItems(prev => prev.map(item => item.id === id ? { ...item, isPacked: !isPacked } : item));
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success("Item removed");
    await fetch(`/api/packing/${tripId}?itemId=${id}`, { method: 'DELETE' });
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    
    const res = await fetch(`/api/packing/${tripId}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim(), category: newItemCategory }) 
    });
    const savedItem = await res.json();
    setItems(prev => [...prev, savedItem]);
    setNewItemName("");
    toast.success("Item added");
  };

  const handleResetAll = async () => {
    setItems(prev => prev.map(item => ({ ...item, isPacked: false })));
    setIsResetDialogOpen(false);
    toast.success("All items reset to unpacked");
    await fetch(`/api/packing/${tripId}/reset`, { method: 'POST' });
  };

  const handleShare = () => {
    const unchecked = items.filter(i => !i.isPacked);
    const text = `🧳 Packing List for ${tripName}\n` + unchecked.map(i => `❌ ${i.name}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Checklist copied to clipboard!");
  };

  const scrollToBottom = () => {
    addInputRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => addInputRef.current?.focus(), 500);
  };

  if (isLoadingPacking && items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 animate-in fade-in duration-500 pb-24">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2.5 rounded-xl">
              <CheckSquare className="w-7 h-7 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Packing Checklist</h1>
          </div>

          <Select 
            value={tripId} 
            onValueChange={(val) => router.push(`/trips/${val}/checklist`)}
          >
            <SelectTrigger className="w-full sm:w-[280px] bg-white border-gray-200">
              <SelectValue placeholder="Select Trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((t: any) => (
                <SelectItem key={t._id} value={t._id}>
                  Trip: {t.title || t.name || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. OVERALL PROGRESS BAR */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-gray-700">Progress: <span className="text-teal-700">{packedItems}/{totalItems} items packed</span></span>
            <span className="text-gray-500">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-gray-200 [&>div]:bg-teal-600" />
        </div>
      </div>

      {/* 3. CATEGORY SECTIONS */}
      <div className="space-y-6">
        {ALL_CATEGORIES.map((category) => {
          const categoryItems = groupedItems[category];
          if (categoryItems.length === 0) return null;

          const packedCount = categoryItems.filter(i => i.isPacked).length;
          const totalCount = categoryItems.length;
          const isAllPacked = packedCount === totalCount && totalCount > 0;

          return (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-colors">
              <div className={`flex items-center justify-between p-4 ${isAllPacked ? 'bg-green-50' : 'bg-teal-50/50'}`}>
                <div className="flex items-center gap-2">
                  <h2 className={`font-bold text-lg ${isAllPacked ? 'text-green-800' : 'text-gray-900'}`}>
                    {category}
                  </h2>
                  {isAllPacked && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <Badge className={`border-none ${isAllPacked ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'}`}>
                  {packedCount}/{totalCount}
                </Badge>
              </div>

              <div className="divide-y divide-gray-50">
                {categoryItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={item.isPacked} 
                        onCheckedChange={(checked) => toggleItem(item.id, !!checked)} 
                        className="w-5 h-5 rounded-md border-gray-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                      <label 
                        className={`text-base select-none cursor-pointer ${item.isPacked ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        onClick={() => toggleItem(item.id, !item.isPacked)}
                      >
                        {item.name}
                      </label>
                    </div>
                    
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. ADD ITEM SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" id="add-item-section">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" /> Add New Item
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            ref={addInputRef}
            placeholder="e.g. Sunglasses, Camera..." 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 bg-gray-50"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <Select value={newItemCategory} onValueChange={setNewItemCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={addItem} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
            Add
          </Button>
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
        <Button variant="outline" className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={scrollToBottom}>
          <Plus className="w-4 h-4 mr-2" /> Add item to checklist
        </Button>
        
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-gray-200 text-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" /> Reset all
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Checklist?</DialogTitle>
              <DialogDescription>
                This will mark all items as unpacked. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleResetAll} className="bg-teal-600 hover:bg-teal-700">
                Yes, Reset All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" /> Share Checklist
        </Button>
      </div>

    </div>
  );
}
