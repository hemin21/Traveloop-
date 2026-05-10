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
const GlobalActivity = mongoose.models.GlobalActivity || mongoose.model("GlobalActivity", ActivitySchema);

const CITIES = [
  // ─── International Cities ─────────────────────────────────────────────────
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
  { name: "Cape Town", country: "South Africa", region: "Africa", costIndex: "Medium", popularity: 86, description: "A port city on South Africa's southwest coast.", highlights: ["Table Mountain", "Robben Island", "Penguin Colony"] },
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

  // ─── Indian Cities ────────────────────────────────────────────────────────
  { name: "Mumbai", country: "India", region: "Asia", costIndex: "Medium", popularity: 92, description: "India's financial capital and Bollywood heartland, where colonial architecture meets modern skylines.", highlights: ["Gateway of India", "Marine Drive", "Elephanta Caves", "Street Food"] },
  { name: "Delhi", country: "India", region: "Asia", costIndex: "Low", popularity: 90, description: "India's sprawling capital blending Mughal heritage with ultra-modern infrastructure.", highlights: ["Red Fort", "Qutub Minar", "India Gate", "Old Delhi Bazaars"] },
  { name: "Jaipur", country: "India", region: "Asia", costIndex: "Low", popularity: 88, description: "The Pink City, famed for its stunning palaces, forts, and vibrant bazaars.", highlights: ["Amber Fort", "Hawa Mahal", "City Palace", "Block Printing"] },
  { name: "Goa", country: "India", region: "Asia", costIndex: "Low", popularity: 91, description: "India's beach paradise with Portuguese-influenced architecture and vibrant nightlife.", highlights: ["Baga Beach", "Dudhsagar Falls", "Spice Plantations", "Cashew Feni"] },
  { name: "Agra", country: "India", region: "Asia", costIndex: "Low", popularity: 89, description: "Home to the iconic Taj Mahal, a UNESCO World Heritage Site and symbol of eternal love.", highlights: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Petha Sweets"] },
  { name: "Varanasi", country: "India", region: "Asia", costIndex: "Low", popularity: 85, description: "One of the world's oldest living cities, the spiritual capital of India on the banks of the Ganga.", highlights: ["Ganga Aarti", "Dashashwamedh Ghat", "Sarnath", "Banarasi Silk"] },
  { name: "Kolkata", country: "India", region: "Asia", costIndex: "Low", popularity: 82, description: "The City of Joy, known for its cultural richness, Durga Puja celebrations, and street food.", highlights: ["Victoria Memorial", "Howrah Bridge", "Durga Puja", "Kathi Rolls"] },
  { name: "Udaipur", country: "India", region: "Asia", costIndex: "Low", popularity: 87, description: "The City of Lakes, a romantic destination with stunning palaces and shimmering lakes.", highlights: ["Lake Pichola", "City Palace", "Jag Mandir", "Mewar Festival"] },
  { name: "Jodhpur", country: "India", region: "Asia", costIndex: "Low", popularity: 83, description: "The Blue City, dominated by the majestic Mehrangarh Fort overlooking a sea of blue-painted houses.", highlights: ["Mehrangarh Fort", "Jaswant Thada", "Clock Tower Market", "Dal Baati"] },
  { name: "Shimla", country: "India", region: "Asia", costIndex: "Low", popularity: 84, description: "The Queen of Hills, a charming colonial hill station in the Himalayas with scenic beauty.", highlights: ["The Ridge", "Mall Road", "Jakhu Temple", "Kufri Snow"] },
  { name: "Manali", country: "India", region: "Asia", costIndex: "Low", popularity: 86, description: "A high-altitude Himalayan resort town known for adventure sports and breathtaking scenery.", highlights: ["Rohtang Pass", "Solang Valley", "Hadimba Temple", "River Rafting"] },
  { name: "Kerala (Alleppey)", country: "India", region: "Asia", costIndex: "Low", popularity: 88, description: "God's Own Country, famous for its tranquil backwaters, houseboat experiences, and Ayurveda.", highlights: ["Backwater Houseboat", "Ayurvedic Spa", "Chinese Fishing Nets", "Onam Festival"] },
  { name: "Rishikesh", country: "India", region: "Asia", costIndex: "Low", popularity: 85, description: "The Yoga Capital of the World, set in the Himalayan foothills along the sacred Ganges river.", highlights: ["Laxman Jhula", "Yoga Retreats", "River Rafting", "Beatles Ashram"] },
  { name: "Mysuru", country: "India", region: "Asia", costIndex: "Low", popularity: 81, description: "The City of Palaces, known for its grand Dasara celebrations and ornate Mysore Palace.", highlights: ["Mysore Palace", "Chamundeshwari Temple", "Dasara Festival", "Silk Sarees"] },
  { name: "Amritsar", country: "India", region: "Asia", costIndex: "Low", popularity: 86, description: "Spiritual home of the Sikh faith, housing the magnificent Golden Temple.", highlights: ["Golden Temple", "Wagah Border Ceremony", "Jallianwala Bagh", "Amritsari Kulcha"] },
  { name: "Darjeeling", country: "India", region: "Asia", costIndex: "Low", popularity: 82, description: "Famous for its tea estates and panoramic views of the Himalayan range including Mt. Kanchenjunga.", highlights: ["Tea Garden Tour", "Tiger Hill Sunrise", "Toy Train", "Darjeeling Tea"] },
  { name: "Hampi", country: "India", region: "Asia", costIndex: "Low", popularity: 79, description: "A UNESCO World Heritage Site featuring the ruins of the Vijayanagara Empire amid a stunning boulder landscape.", highlights: ["Virupaksha Temple", "Vittala Temple", "Bouldering", "Tungabhadra River"] },
  { name: "Pondicherry", country: "India", region: "Asia", costIndex: "Low", popularity: 80, description: "A French colonial coastal town known for its yoga, cafes, ashrams, and gorgeous beach promenade.", highlights: ["French Quarter", "Auroville", "Promenade Beach", "Sri Aurobindo Ashram"] },
  { name: "Hyderabad", country: "India", region: "Asia", costIndex: "Low", popularity: 84, description: "The City of Pearls and Biryani, a major tech hub blending Nizami heritage with modern innovation.", highlights: ["Charminar", "Golconda Fort", "Hyderabadi Biryani", "Hussain Sagar"] },
  { name: "Leh-Ladakh", country: "India", region: "Asia", costIndex: "Medium", popularity: 87, description: "A high-altitude desert region of breathtaking landscapes, Buddhist monasteries, and adventure.", highlights: ["Pangong Lake", "Nubra Valley", "Magnetic Hill", "Monastery Circuit"] },
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

  // ─── Indian Activities ────────────────────────────────────────────────────
  // Mumbai
  { name: "Gateway of India Visit", city: "Mumbai", country: "India", type: "Sightseeing", estimatedCost: 0, duration: 1, description: "Visit the iconic colonial-era arch overlooking the Arabian Sea.", bestTimeToVisit: "Morning", rating: 4.5 },
  { name: "Mumbai Street Food Tour", city: "Mumbai", country: "India", type: "Food", estimatedCost: 600, duration: 3, description: "Vada Pav, Pav Bhaji, and Bhel Puri at the best local spots.", bestTimeToVisit: "Evening", rating: 4.8 },
  { name: "Elephanta Caves Ferry", city: "Mumbai", country: "India", type: "Sightseeing", estimatedCost: 200, duration: 4, description: "Ferry to the rock-cut Shiva temples on Elephanta Island.", bestTimeToVisit: "Morning", rating: 4.4 },

  // Delhi
  { name: "Red Fort Guided Tour", city: "Delhi", country: "India", type: "Sightseeing", estimatedCost: 650, duration: 2, description: "Explore the magnificent Mughal fort with a light and sound show at night.", bestTimeToVisit: "Morning", rating: 4.6 },
  { name: "Old Delhi Bazaar Walk", city: "Delhi", country: "India", type: "Food", estimatedCost: 500, duration: 3, description: "Taste Paranthe Wali Gali, Jalebi, and Kulfi in the historic lanes.", bestTimeToVisit: "Morning", rating: 4.9 },
  { name: "Qutub Minar Visit", city: "Delhi", country: "India", type: "Sightseeing", estimatedCost: 600, duration: 1.5, description: "See the towering 13th-century minaret, a UNESCO World Heritage Site.", bestTimeToVisit: "Afternoon", rating: 4.5 },

  // Jaipur
  { name: "Amber Fort Elephant Ride", city: "Jaipur", country: "India", type: "Adventure", estimatedCost: 1200, duration: 3, description: "Ride an elephant up to the majestic Amber Fort.", bestTimeToVisit: "Morning", rating: 4.7 },
  { name: "Hawa Mahal Visit & Johari Bazaar", city: "Jaipur", country: "India", type: "Sightseeing", estimatedCost: 50, duration: 2, description: "See the iconic Palace of Winds and shop for gems and textiles.", bestTimeToVisit: "Morning", rating: 4.6 },
  { name: "Dal Baati Churma Experience", city: "Jaipur", country: "India", type: "Food", estimatedCost: 400, duration: 1, description: "Savour the quintessential Rajasthani thali at a haveli restaurant.", bestTimeToVisit: "Lunch", rating: 4.8 },

  // Agra
  { name: "Taj Mahal Sunrise Visit", city: "Agra", country: "India", type: "Sightseeing", estimatedCost: 1300, duration: 3, description: "Witness the Taj Mahal at sunrise — the most stunning view of the monument.", bestTimeToVisit: "Dawn", rating: 5.0 },
  { name: "Agra Fort Exploration", city: "Agra", country: "India", type: "Sightseeing", estimatedCost: 650, duration: 2, description: "Explore this UNESCO site built by Emperor Akbar.", bestTimeToVisit: "Afternoon", rating: 4.6 },

  // Varanasi
  { name: "Ganga Aarti Ceremony", city: "Varanasi", country: "India", type: "Sightseeing", estimatedCost: 0, duration: 1.5, description: "Witness the nightly fire puja ceremony at Dashashwamedh Ghat.", bestTimeToVisit: "Evening", rating: 4.9 },
  { name: "Varanasi Boat Ride at Dawn", city: "Varanasi", country: "India", type: "Adventure", estimatedCost: 300, duration: 2, description: "Row along the ghats as the holy city wakes up, one of life's most moving experiences.", bestTimeToVisit: "Dawn", rating: 4.8 },

  // Goa
  { name: "Baga Beach Day Out", city: "Goa", country: "India", type: "Adventure", estimatedCost: 1000, duration: 5, description: "Swim, sunbathe, and enjoy water sports on Goa's most lively beach.", bestTimeToVisit: "Morning", rating: 4.5 },
  { name: "Dudhsagar Waterfall Trek", city: "Goa", country: "India", type: "Adventure", estimatedCost: 800, duration: 6, description: "Trek or jeep-ride through jungle to one of India's tallest waterfalls.", bestTimeToVisit: "Morning", rating: 4.7 },

  // Kerala
  { name: "Alleppey Backwater Houseboat", city: "Kerala (Alleppey)", country: "India", type: "Adventure", estimatedCost: 6000, duration: 24, description: "Overnight houseboat through the Kerala backwaters amid paddy fields and coconut groves.", bestTimeToVisit: "Morning", rating: 4.9 },
  { name: "Ayurvedic Massage & Spa", city: "Kerala (Alleppey)", country: "India", type: "Hotel", estimatedCost: 2000, duration: 2, description: "Traditional Abhyanga and Shirodhara treatments from certified Ayurvedic practitioners.", bestTimeToVisit: "Afternoon", rating: 4.8 },

  // Amritsar
  { name: "Golden Temple Visit", city: "Amritsar", country: "India", type: "Sightseeing", estimatedCost: 0, duration: 3, description: "Visit the spiritual heart of Sikhism — stunning in golden light, especially at night.", bestTimeToVisit: "Evening", rating: 4.9 },
  { name: "Wagah Border Retreat Ceremony", city: "Amritsar", country: "India", type: "Sightseeing", estimatedCost: 0, duration: 2, description: "Watch the dramatic India-Pakistan flag-lowering parade at the border.", bestTimeToVisit: "Evening", rating: 4.8 },
  { name: "Amritsari Kulcha Breakfast", city: "Amritsar", country: "India", type: "Food", estimatedCost: 200, duration: 1, description: "Iconic stuffed kulcha with chole and lassi at legendary eateries.", bestTimeToVisit: "Morning", rating: 4.9 },

  // Leh-Ladakh
  { name: "Pangong Lake Day Trip", city: "Leh-Ladakh", country: "India", type: "Adventure", estimatedCost: 2500, duration: 8, description: "Drive to the breathtaking high-altitude salt lake, famous from Bollywood films.", bestTimeToVisit: "Morning", rating: 4.9 },
  { name: "Nubra Valley Camel Safari", city: "Leh-Ladakh", country: "India", type: "Adventure", estimatedCost: 500, duration: 1, description: "Ride Bactrian camels through the surreal sand dunes of Nubra Valley.", bestTimeToVisit: "Afternoon", rating: 4.7 },

  // Additional generated activities to reach ~150
];

// Fill the rest of the 150 activities dynamically based on cities
const ACTIVITY_TYPES = ["Sightseeing", "Food", "Adventure", "Transport", "Hotel"];
for (let i = ACTIVITIES.length; i < 150; i++) {
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
    await GlobalActivity.deleteMany({});

    // Insert
    await City.insertMany(CITIES);
    await GlobalActivity.insertMany(ACTIVITIES);

    return NextResponse.json({ message: `Successfully seeded ${CITIES.length} cities and ${ACTIVITIES.length} activities (including 20 Indian cities).` });
  } catch (error) {
    console.error("Seed error", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
