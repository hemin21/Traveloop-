import { Skeleton } from "@/components/ui/skeleton";

export default function TripsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-4" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
            <Skeleton className="w-full h-48 rounded-none" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
              <Skeleton className="w-1/2 h-4" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
