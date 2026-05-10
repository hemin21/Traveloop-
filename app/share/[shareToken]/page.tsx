import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/lib/models/Trip";
import Stop from "@/lib/models/Stop";
import Activity from "@/lib/models/Activity";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Map, Calendar, Copy, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { shareToken: string } }) {
  await connectToDatabase();
  const trip = await Trip.findOne({ shareToken: params.shareToken });
  if (!trip) return { title: "Not Found | Traveloop" };
  
  return {
    title: `${trip.title} | Traveloop`,
    description: trip.description || `Check out this amazing trip itinerary!`,
    openGraph: {
      title: trip.title,
      description: trip.description || "Check out this amazing trip itinerary!",
    }
  };
}

export default async function SharedTripPage({ params }: { params: { shareToken: string } }) {
  await connectToDatabase();
  
  const trip = await Trip.findOne({ shareToken: params.shareToken });
  if (!trip) {
    notFound();
  }

  const stops = await Stop.find({ tripId: trip._id }).sort({ order: 1 });
  const activities = await Activity.find({ stopId: { $in: stops.map(s => s._id) } }).sort({ date: 1 });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Readonly Hero */}
      <div className="bg-teal-700 text-white py-12 px-4 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link href="/" className="inline-block mb-6 text-teal-200 hover:text-white font-medium text-sm">
              &larr; Back to Traveloop
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{trip.title}</h1>
            <p className="text-teal-100 text-lg mb-4 max-w-2xl">{trip.description || "A wonderful trip planned on Traveloop"}</p>
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <span className="flex items-center gap-1 bg-black/20 py-1.5 px-3 rounded-full">
                <Calendar className="w-4 h-4" />
                {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1 bg-black/20 py-1.5 px-3 rounded-full">
                <Map className="w-4 h-4" />
                {stops.length} Stops
              </span>
            </div>
          </div>
          <div className="shrink-0 bg-white/10 p-5 rounded-xl backdrop-blur-md border border-white/20 w-full md:w-auto">
             <p className="text-sm text-teal-100 mb-3 text-center">Want to take this trip?</p>
             <Link href="/sign-up" className="block w-full">
               <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-md py-6">
                  <Copy className="w-5 h-5 mr-2" />
                  Copy This Trip
               </Button>
             </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Itinerary Overview</h2>
        
        <div className="space-y-6">
          {stops.map((stop, index) => {
            const stopActivities = activities.filter(a => a.stopId.toString() === stop._id.toString());
            
            return (
              <Card key={stop._id.toString()} className="border-teal-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-teal-50 border-b border-teal-100 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-teal-800 flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white text-sm">
                        {index + 1}
                      </span>
                      {stop.city}, {stop.country}
                    </CardTitle>
                    <Badge variant="outline" className="bg-white text-teal-800 border-teal-200">
                      {format(new Date(stop.startDate), "MMM d")} - {format(new Date(stop.endDate), "MMM d")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {stopActivities.length > 0 ? (
                    <div className="divide-y">
                      {stopActivities.map(activity => (
                        <div key={activity._id.toString()} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                              {activity.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                          </div>
                          <div className="flex items-start shrink-0">
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 capitalize">
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No specific activities planned for this stop yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {stops.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              This trip is still in the early planning stages! No stops have been added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
