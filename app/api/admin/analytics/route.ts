import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Trip from '@/lib/models/Trip';
import Stop from '@/lib/models/Stop';
import Activity from '@/lib/models/Activity';

export async function GET() {
  try {
    await connectToDatabase();

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const twelveWeeksAgo = new Date(new Date().setDate(new Date().getDate() - 84));

    const [
      totalUsers,
      totalTrips,
      tripsThisWeekResult,
      popularCities,
      popularActivities,
      tripsPerDay,
      userGrowth
    ] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      Trip.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      }),
      Stop.aggregate([
        { $group: { _id: "$cityName", country: { $first: "$country" }, count: { $sum: 1 }, avgBudget: { $avg: "$budget" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { name: "$_id", count: 1, country: 1, avgBudget: { $round: ["$avgBudget", 2] }, _id: 0 } }
      ]),
      Activity.aggregate([
        { $group: { _id: "$name", type: { $first: "$type" }, count: { $sum: 1 }, avgCost: { $avg: "$cost" } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { name: "$_id", type: 1, count: 1, avgCost: { $round: ["$avgCost", 2] }, _id: 0 } }
      ]),
      Trip.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        { $group: { 
            _id: { $dateToString: { format: "%Y-%U", date: "$createdAt" } }, 
            count: { $sum: 1 } 
        } },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } }
      ])
    ]);

    return NextResponse.json({
      totalUsers,
      totalTrips,
      tripsThisWeek: tripsThisWeekResult,
      popularCities,
      popularActivities,
      tripsPerDay,
      userGrowth
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
