"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, Plus, Pencil, Trash2, Calendar, MapPin, Clock, Notebook
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function TripNotesPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [activeTab, setActiveTab] = useState("all");
  const [notes, setNotes] = useState<any[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Dialog states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    stop: "none",
    day: "",
  });

  // Fetch data
  const { data: tripsData } = useSWR("/api/trips", fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  const { data: tripData } = useSWR(`/api/trips/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });
  const { data: notesData, isLoading: isLoadingNotes } = useSWR(`/api/notes/${tripId}`, fetcher, {
    onErrorRetry: (e, k, c, r, { retryCount }) => { if (retryCount >= 1) return; }
  });

  // Mocks
  const mockTrips = [
    { _id: tripId, name: "Paris & Rome Adventure" },
    { _id: "trip2", name: "Bali Summer Retreat" },
  ];
  const trips = tripsData?.trips || (Array.isArray(tripsData) ? tripsData : mockTrips);
  const currentTrip = trips.find((t: any) => t._id === tripId) || tripData || { _id: tripId, name: "Paris & Rome Adventure" };
  const mockStops = ["Paris", "Rome"]; // From trip details in a real scenario

  const mockNotes = [
    { _id: "n1", title: "Hotel Check-in Details", content: "Rome Hotel booking #12345. Ask for early check-in if possible. Also check if breakfast is included.", stop: "Rome", day: 4, date: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: "n2", title: "Eiffel Tower Tickets", content: "Don't forget to print the tickets! Meeting point is the East pillar at 9:45 AM sharp.", stop: "Paris", day: 2, date: new Date().toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: "n3", title: "General Packing Reminders", content: "Bring the universal adapter and an extra power bank for long days.", stop: "none", day: null, date: new Date().toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  useEffect(() => {
    if (notesData && notesData.notes) {
      setNotes(notesData.notes);
    } else if (!isLoadingNotes) {
      setNotes(mockNotes);
    }
  }, [notesData, isLoadingNotes]);

  // Derived & Sorted Data
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes]);

  const notesByDay = useMemo(() => {
    const groups: Record<number, any[]> = {};
    const unassigned: any[] = [];
    sortedNotes.forEach(n => {
      if (n.day) {
        if (!groups[n.day]) groups[n.day] = [];
        groups[n.day].push(n);
      } else {
        unassigned.push(n);
      }
    });
    return { groups, unassigned };
  }, [sortedNotes]);

  const notesByStop = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const unassigned: any[] = [];
    sortedNotes.forEach(n => {
      if (n.stop && n.stop !== "none") {
        if (!groups[n.stop]) groups[n.stop] = [];
        groups[n.stop].push(n);
      } else {
        unassigned.push(n);
      }
    });
    return { groups, unassigned };
  }, [sortedNotes]);

  // Handlers
  const openAddNote = () => {
    setNoteToEdit(null);
    setFormData({ title: "", content: "", stop: "none", day: "" });
    setIsNoteDialogOpen(true);
  };

  const openEditNote = (note: any) => {
    setNoteToEdit(note);
    setFormData({
      title: note.title || "",
      content: note.content || "",
      stop: note.stop || "none",
      day: note.day?.toString() || "",
    });
    setIsNoteDialogOpen(true);
  };

  const saveNote = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const newNote = {
      _id: noteToEdit?._id || Date.now().toString(),
      title: formData.title,
      content: formData.content,
      stop: formData.stop,
      day: formData.day ? parseInt(formData.day, 10) : null,
      date: noteToEdit?.date || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (noteToEdit) {
      setNotes(notes.map(n => n._id === noteToEdit._id ? newNote : n));
      toast.success("Note updated");
      // MOCK API: await fetch(`/api/notes/${tripId}?noteId=${noteToEdit._id}`, { method: "PUT", ... })
    } else {
      setNotes([newNote, ...notes]);
      toast.success("Note added");
      // MOCK API: await fetch(`/api/notes/${tripId}`, { method: "POST", ... })
    }

    setIsNoteDialogOpen(false);
  };

  const confirmDelete = (id: string) => {
    setNoteToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const deleteNote = async () => {
    if (!noteToDelete) return;
    setNotes(notes.filter(n => n._id !== noteToDelete));
    setIsDeleteDialogOpen(false);
    toast.success("Note deleted");
    // MOCK API: await fetch(`/api/notes/${tripId}?noteId=${noteToDelete}`, { method: "DELETE" })
  };

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // UI Components
  const renderNoteCard = (note: any) => {
    const isExpanded = expandedNotes[note._id];
    
    return (
      <div key={note._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:bg-teal-50/30 transition-colors group">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-bold text-gray-900 leading-snug">{note.title}</h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEditNote(note)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => confirmDelete(note._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-gray-600 text-sm whitespace-pre-wrap ${!isExpanded && 'line-clamp-3'}`}>
            {note.content}
          </p>
          {note.content.length > 150 && (
            <button 
              onClick={() => toggleExpand(note._id)} 
              className="text-teal-600 text-sm font-medium mt-1 hover:underline"
            >
              {isExpanded ? "read less" : "read more"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 border-t border-gray-50 text-xs text-gray-500 font-medium">
          {note.day && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Day {note.day}
            </div>
          )}
          {note.stop && note.stop !== "none" && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {note.stop} stop
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto text-gray-400" title={format(new Date(note.updatedAt), "MMMM d, yyyy 'at' h:mm a")}>
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(note.updatedAt))} ago
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingNotes && notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2.5 rounded-xl">
            <FileText className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Notes</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={tripId} onValueChange={(val) => router.push(`/trips/${val}/notes`)}>
            <SelectTrigger className="w-full sm:w-[240px] bg-white">
              <SelectValue placeholder="Select Trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((t: any) => (
                <SelectItem key={t._id} value={t._id}>
                  Trip: {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openAddNote} className="bg-teal-600 hover:bg-teal-700 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Note
          </Button>
        </div>
      </div>

      {/* 2. FILTER TABS & NOTES */}
      {sortedNotes.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center space-y-4">
          <div className="text-5xl">📓</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">No notes yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              Jot down hotel check-in details, local tips, or reminders for your trip.
            </p>
          </div>
          <Button onClick={openAddNote} className="bg-teal-600 hover:bg-teal-700 mt-4">
            Add your first note
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="by-day" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">By Day</TabsTrigger>
            <TabsTrigger value="by-stop" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">By Stop</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 outline-none">
            {sortedNotes.map(renderNoteCard)}
          </TabsContent>

          <TabsContent value="by-day" className="space-y-8 outline-none">
            {Object.keys(notesByDay.groups).map(Number).sort((a, b) => a - b).map(day => (
              <div key={`day-${day}`} className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" /> Day {day}
                </h3>
                {notesByDay.groups[day].map(renderNoteCard)}
              </div>
            ))}
            {notesByDay.unassigned.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-lg text-gray-500 border-b border-gray-100 pb-2">General / Unassigned</h3>
                {notesByDay.unassigned.map(renderNoteCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="by-stop" className="space-y-8 outline-none">
            {Object.keys(notesByStop.groups).sort().map(stop => (
              <div key={`stop-${stop}`} className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" /> {stop} Stop
                </h3>
                {notesByStop.groups[stop].map(renderNoteCard)}
              </div>
            ))}
            {notesByStop.unassigned.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-lg text-gray-500 border-b border-gray-100 pb-2">General / Unassigned</h3>
                {notesByStop.unassigned.map(renderNoteCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 3. ADD/EDIT NOTE DIALOG */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{noteToEdit ? "Edit Note" : "Add Note"}</DialogTitle>
            <DialogDescription>
              {noteToEdit ? "Make changes to your trip note." : "Add a new note, reminder, or journal entry."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Note Title *</label>
              <Input 
                placeholder="e.g. Hotel check-in details - Rome stop" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea 
                placeholder="Type your note here..." 
                className="min-h-[120px]"
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Link to Stop (Optional)</label>
                <Select value={formData.stop} onValueChange={(val) => setFormData({...formData, stop: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Stop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {mockStops.map(stop => (
                      <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Link to Day (Optional)</label>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="e.g. 1" 
                  value={formData.day} 
                  onChange={(e) => setFormData({...formData, day: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={saveNote}>
              {noteToEdit ? "Update Note" : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Note?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={deleteNote}>
              Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
