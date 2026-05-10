import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";

const CitySchema = new mongoose.Schema({
  name: String,
  country: String,
  region: String,
  costIndex: String,
  popularity: Number,
  description: String,
  highlights: [String],
});

const ActivitySchema = new mongoose.Schema({
  name: String,
  city: String,
  country: String,
  type: String,
  estimatedCost: Number,
  duration: Number,
  description: String,
  bestTimeToVisit: String,
  rating: Number,
});

const City = mongoose.models.City || mongoose.model("City", CitySchema);
const Activity = mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);

const CITIES = [
  { name: "Paris", country: "France", region: "Europe", costIndex: "High", popularity: 98, description: "The city of light, famous for its cafe culture and the Eiffel Tower.", highlights: ["Eiffel Tower", "Louvre Museum", "Fine Dining"] },
  { name: "Rome", country: "Italy", region: "Europe", costIndex: "Medium", popularity: 95, description: "The eternal city, where ancient history meets vibrant street life.", highlights: ["Colosseum", "Vatican City", "Pasta & Gelato"] },
  { name: "Tokyo", country: "Japan", region: "Asia", costIndex: "High", popularity: 99, description: "A bustling metropolis blending ultra-modern and traditional.", highlights: ["Shibuya Crossing", "Sushi", "Temples"] },
  { name: "Bali", country: "Indonesia", region: "Asia", costIndex: "Low", popularity: 92, description: "Island of the gods, known for its forested volcanic mountains and beaches.", highlights: ["Ubud Monkey Forest", "Surfing", "Temples"] },
  { name: "Barcelona", country: "Spain", region: "Europe", costIndex: "Medium", popularity: 93, description: "A vibrant city known for its art and architecture.", highlights: ["Sagrada Familia", "Tapas", "Beaches"] },
  { name: "New York", country: "USA", region: "Americas", costIndex: "High", popularity: 97, description: "The city that never sleeps, offering world-class entertainment.", highlights: ["Times Square", "Central Park", "Broadway"] },
  { name: "Dubai", country: "UAE", region: "Middle East", costIndex: "High", popularity: 94, description: "A city of skyscrapers, luxury shopping, and desert safaris.", highlights: ["Burj Khalifa", "Desert Safari", "Luxury Malls"] },
  { name: "London", country: "UK", region: "Europe", costIndex: "High", popularity: 96, description: "A historic city with iconic landmarks and a vibrant culture.", highlights: ["Big Ben", "British Museum", "London Eye"] },
  { name: "Amsterdam", country: "Netherlands", region: "Europe", costIndex: "High", popularity: 90, description: "Known for its artistic heritage and elaborate canal system.", highlights: ["Canal Cruise", "Van Gogh Museum", "Cycling"] },
  { name: "Prague", country: "Czech Republic", region: "Europe", costIndex: "Medium", popularity: 88, description: "A city of a hundred spires with a stunning historic center.", highlights: ["Charles Bridge", "Prague Castle", "Beer"] },
  { name: "Lisbon", country: "Portugal", region: "Europe", costIndex: "Medium", popularity: 89, description: "A coastal city known for its cafe culture and soulful Fado music.", highlights: ["Belem Tower", "Tram 28", "Pastéis de Nata"] },
  { name: "Bangkok", country: "Thailand", region: "Asia", costIndex: "Low", popularity: 91, description: "A vibrant city known for its ornate shrines and vibrant street life.", highlights: ["Grand Palace", "Street Food", "Floating Markets"] },
  { name: "Singapore", country: "Singapore", region: "Asia", costIndex: "High", popularity: 87, description: "A global financial center with a tropical climate and multicultural population.", highlights: ["Gardens by the Bay", "Marina Bay Sands", "Hawker Centers"] },
  { name: "Istanbul", country: "Turkey", region: "Europe/Asia", costIndex: "Medium", popularity: 89, description: "A city straddling Europe and Asia across the Bosphorus Strait.", highlights: ["Hagia Sophia", "Grand Bazaar", "Bosphorus Cruise"] },
  { name: "Cairo", country: "Egypt", region: "Middle East", costIndex: "Low", popularity: 85, description: "The sprawling capital set on the Nile River.", highlights: ["Pyramids of Giza", "Egyptian Museum", "Khan el-Khalili"] },
  { name: "Sydney", country: "Australia", region: "Oceania", costIndex: "High", popularity: 88, description: "Known for its Sydney Opera House and harbourfront.", highlights: ["Opera House", "Bondi Beach", "Harbour Bridge"] },
  { name: "Toronto", country: "Canada", region: "Americas", costIndex: "Medium", popularity: 84, description: "A major Canadian city with a dynamic core and soaring skyscrapers.", highlights: ["CN Tower", "Distillery District", "Museums"] },
  { name: "Mexico City", country: "Mexico", region: "Americas", costIndex: "Low", popularity: 86, description: "A densely populated, high-altitude capital known for its historic center.", highlights: ["Zócalo", "Frida Kahlo Museum", "Street Tacos"] },
  { name: "Rio de Janeiro", country: "Brazil", region: "Americas", costIndex: "Medium", popularity: 87, description: "Famed for its Copacabana and Ipanema beaches.", highlights: ["Christ the Redeemer", "Sugarloaf Mountain", "Carnival"] },
  { name: "Cape Town", country: "South Africa", region: "Africa", costIndex: "Medium", popularity: 86, description: "A port city on South Africa’s southwest coast.", highlights: ["Table Mountain", "Robben Island", "Penguin Colony"] },
  { name: "Marrakech", country: "Morocco", region: "Africa", costIndex: "Low", popularity: 84, description: "A former imperial city known for its bustling medinas.", highlights: ["Jemaa el-Fnaa", "Majorelle Garden", "Souks"] },
  { name: "Kyoto", country: "Japan", region: "Asia", costIndex: "High", popularity: 93, description: "Famous for its numerous classical Buddhist temples.", highlights: ["Fushimi Inari Taisha", "Kinkaku-ji", "Geisha District"] },
  { name: "Seoul", country: "South Korea", region: "Asia", costIndex: "Medium", popularity: 90, description: "A huge metropolis where modern skyscrapers meet Buddhist temples.", highlights: ["Gyeongbokgung Palace", "Myeongdong", "K-Pop"] },
  { name: "Berlin", country: "Germany", region: "Europe", costIndex: "Medium", popularity: 88, description: "Known for its art scene and modern landmarks.", highlights: ["Brandenburg Gate", "Berlin Wall", "Nightlife"] },
  { name: "Vienna", country: "Austria", region: "Europe", costIndex: "High", popularity: 87, description: "Known for its Imperial palaces and musical legacy.", highlights: ["Schönbrunn Palace", "Classical Music", "Coffee Houses"] },
  { name: "Athens", country: "Greece", region: "Europe", costIndex: "Medium", popularity: 85, description: "The historical capital of Europe.", highlights: ["Acropolis", "Parthenon", "Plaka"] },
  { name: "Buenos Aires", country: "Argentina", region: "Americas", costIndex: "Medium", popularity: 83, description: "Known for its European atmosphere and passionate tango.", highlights: ["Tango Shows", "Recoleta", "Steakhouses"] },
  { name: "Vancouver", country: "Canada", region: "Americas", costIndex: "High", popularity: 85, description: "A bustling west coast seaport.", highlights: ["Stanley Park", "Granville Island", "Mountains"] },
  { name: "Auckland", country: "New Zealand", region: "Oceania", costIndex: "High", popularity: 82, description: "Based around 2 large harbours.", highlights: ["Sky Tower", "Waiheke Island", "Sailing"] },
  { name: "Hanoi", country: "Vietnam", region: "Asia", costIndex: "Low", popularity: 81, description: "Known for its centuries-old architecture.", highlights: ["Old Quarter", "Hoan Kiem Lake", "Pho"] },
];

const ACTIVITIES = [
  // Paris
  { name: "Eiffel Tower Summit", city: "Paris", country: "France", type: "Sightseeing", estimatedCost: 30, duration: 2, description: "Take the elevator to the top of the iconic Eiffel Tower.", bestTimeToVisit: "Sunset", rating: 4.8 },
  { name: "Louvre Guided Tour", city: "Paris", country: "France", type: "Sightseeing", estimatedCost: 45, duration: 3, description: "See the Mona Lisa and thousands of other masterpieces.", bestTimeToVisit: "Morning", rating: 4.7 },
  { name: "Seine River Cruise", city: "Paris", country: "France", type: "Transport", estimatedCost: 20, duration: 1, description: "Enjoy a relaxing boat ride along the Seine.", bestTimeToVisit: "Evening", rating: 4.5 },
  { name: "Dinner at Le Jules Verne", city: "Paris", country: "France", type: "Food", estimatedCost: 250, duration: 2.5, description: "Fine dining on the second floor of the Eiffel Tower.", bestTimeToVisit: "Night", rating: 4.9 },
  
  // Rome
  { name: "Colosseum Tour", city: "Rome", country: "Italy", type: "Sightseeing", estimatedCost: 35, duration: 2, description: "Explore the ancient amphitheater.", bestTimeToVisit: "Morning", rating: 4.8 },
  { name: "Vatican Museum & Sistine Chapel", city: "Rome", country: "Italy", type: "Sightseeing", estimatedCost: 50, duration: 4, description: "Witness the magnificent art of the Vatican.", bestTimeToVisit: "Morning", rating: 4.7 },
  { name: "Gelato Tasting", city: "Rome", country: "Italy", type: "Food", estimatedCost: 10, duration: 1, description: "Sample the best gelato flavors in Rome.", bestTimeToVisit: "Afternoon", rating: 4.9 },

  // Tokyo
  { name: "Shibuya Crossing Walk", city: "Tokyo", country: "Japan", type: "Sightseeing", estimatedCost: 0, duration: 1, description: "Experience the busiest intersection in the world.", bestTimeToVisit: "Evening", rating: 4.6 },
  { name: "Tsukiji Outer Market Food Tour", city: "Tokyo", country: "Japan", type: "Food", estimatedCost: 80, duration: 3, description: "Taste fresh sushi and Japanese delicacies.", bestTimeToVisit: "Morning", rating: 4.8 },
  { name: "Mount Fuji Day Trip", city: "Tokyo", country: "Japan", type: "Adventure", estimatedCost: 120, duration: 10, description: "See Japan's iconic peak.", bestTimeToVisit: "Morning", rating: 4.7 },

  // Bali
  { name: "Ubud Monkey Forest", city: "Bali", country: "Indonesia", type: "Adventure", estimatedCost: 5, duration: 2, description: "Walk among hundreds of monkeys in a sacred forest.", bestTimeToVisit: "Morning", rating: 4.5 },
  { name: "Surfing Lesson at Kuta", city: "Bali", country: "Indonesia", type: "Adventure", estimatedCost: 25, duration: 2, description: "Learn to surf on Bali's most famous beach.", bestTimeToVisit: "Morning", rating: 4.6 },
  
  // New York
  { name: "Statue of Liberty Cruise", city: "New York", country: "USA", type: "Sightseeing", estimatedCost: 25, duration: 2, description: "Sail past the iconic Statue of Liberty.", bestTimeToVisit: "Afternoon", rating: 4.7 },
  { name: "Broadway Show", city: "New York", country: "USA", type: "Sightseeing", estimatedCost: 150, duration: 3, description: "Watch a world-class theatrical performance.", bestTimeToVisit: "Evening", rating: 4.9 },
  { name: "Central Park Bike Tour", city: "New York", country: "USA", type: "Adventure", estimatedCost: 40, duration: 2, description: "Cycle through the beautiful paths of Central Park.", bestTimeToVisit: "Morning", rating: 4.6 },

  // Dubai
  { name: "Burj Khalifa At The Top", city: "Dubai", country: "UAE", type: "Sightseeing", estimatedCost: 45, duration: 2, description: "Views from the tallest building in the world.", bestTimeToVisit: "Sunset", rating: 4.7 },
  { name: "Desert Safari & BBQ", city: "Dubai", country: "UAE", type: "Adventure", estimatedCost: 60, duration: 6, description: "Dune bashing followed by a traditional dinner.", bestTimeToVisit: "Afternoon", rating: 4.6 },

  // London
  { name: "London Eye Flight", city: "London", country: "UK", type: "Sightseeing", estimatedCost: 40, duration: 1, description: "Panoramic views of London from a giant observation wheel.", bestTimeToVisit: "Sunset", rating: 4.5 },
  { name: "Tower of London Tour", city: "London", country: "UK", type: "Sightseeing", estimatedCost: 35, duration: 3, description: "See the Crown Jewels and explore history.", bestTimeToVisit: "Morning", rating: 4.7 },

  // Mexico City
  { name: "Teotihuacan Pyramids Tour", city: "Mexico City", country: "Mexico", type: "Adventure", estimatedCost: 40, duration: 6, description: "Climb the ancient pyramids of the sun and moon.", bestTimeToVisit: "Morning", rating: 4.8 },
  { name: "Street Food Taco Crawl", city: "Mexico City", country: "Mexico", type: "Food", estimatedCost: 30, duration: 3, description: "Taste authentic Mexican tacos in local neighborhoods.", bestTimeToVisit: "Evening", rating: 4.9 },

  // Additional generated activities to reach ~100
];

// Fill the rest of the 100 activities dynamically based on cities
const ACTIVITY_TYPES = ["Sightseeing", "Food", "Adventure", "Transport", "Hotel"];
for (let i = ACTIVITIES.length; i < 100; i++) {
  const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
  const type = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
  ACTIVITIES.push({
    name: `Sample ${type} in ${randomCity.name}`,
    city: randomCity.name,
    country: randomCity.country,
    type: type,
    estimatedCost: Math.floor(Math.random() * 200) + 10,
    duration: Math.floor(Math.random() * 6) + 1,
    description: `A wonderful ${type.toLowerCase()} experience located in the heart of ${randomCity.name}.`,
    bestTimeToVisit: "Anytime",
    rating: (Math.random() * 2 + 3).toFixed(1) as any, // 3.0 to 5.0
  });
}

export async function GET() {
  try {
    await connectToDatabase();

    // Clear existing
    await City.deleteMany({});
    await Activity.deleteMany({});

    // Insert
    await City.insertMany(CITIES);
    await Activity.insertMany(ACTIVITIES);

    return NextResponse.json({ message: "Successfully seeded 30 cities and 100 activities." });
  } catch (error) {
    console.error("Seed error", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
