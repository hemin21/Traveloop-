import { Skeleton } from "@/components/ui/skeleton";

export default function TripDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-48 sm:h-64 rounded-2xl" />
      
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-32 h-10" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
              <Skeleton className="w-1/3 h-6 mb-4" />
              <div className="space-y-3">
                <Skeleton className="w-full h-20 rounded-lg" />
                <Skeleton className="w-full h-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="w-full lg:w-80 space-y-6">
          <Skeleton className="w-full h-[400px] rounded-xl" />
          <Skeleton className="w-full h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
