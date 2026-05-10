🎯 About the Project
Traveloop is a personalized, intelligent, and collaborative travel planning platform that transforms the way individuals plan and experience travel. It empowers users to dream, design, and organize trips with ease — making travel planning as exciting as the trip itself.
Built for the Odoo Hackathon 2025, Traveloop solves the complexity of multi-city travel planning by providing:

🗺️ Smart itinerary building with day-wise activity planning
💰 Automatic budget tracking with visual breakdowns
🤝 Community sharing to inspire fellow travelers
📦 Packing checklists so nothing gets forgotten
🧾 Expense invoices with PDF export
📝 Trip journals for important notes and reminders

✨ Features
ScreenFeatureDescription1-2
🔐 AuthLogin & Registration via Clerk3
🏠 DashboardLanding page with trip overview & city discovery4
✈️ Create TripMulti-step trip creation form5
🗺️ Itinerary BuilderDynamic section-based trip planner6
📋 My TripsTrip listing with Ongoing / Upcoming / Completed7
👤 ProfileUser profile with trip history8
🔍 SearchCity and activity discovery with filters9
👁️ Itinerary ViewDay-wise view with recharts budget breakdown10
👥 CommunityPublic trip feed with like & copy trip11
✅ Packing ChecklistPer-trip categorized packing manager12
⚙️ Admin PanelAnalytics dashboard for admins13
📝 Trip NotesJournal notes per trip or per stop14
🧾 InvoiceAuto-generated expense invoice with PDF export

🛠️ Tech Stack
Frontend

Next.js 14 (App Router)
React 18 with hooks
Tailwind CSS for styling
shadcn/ui component library
Recharts for data visualization
Lucide React for icons
SWR for data fetching & caching

Backend

Next.js API Routes (serverless)
MongoDB Atlas (cloud database)
Mongoose (ODM)

Auth & Services

Clerk for authentication (login, signup, session management)
Svix for Clerk webhooks
html2canvas + jsPDF for PDF invoice export
date-fns for date utilities

State Management

React useState / useReducer for local state
Zustand for global trip builder state
SWR for server state & caching


VariableWhere to find it
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY Clerk Dashboard → API Keys
CLERK_SECRET_KEYClerk Dashboard → API Keys
CLERK_WEBHOOK_SECRETClerk Dashboard → Webhooks → your endpoint
MONGODB_URIMongoDB Atlas → Database → Connect → Drivers
