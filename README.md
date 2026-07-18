# 🚀 RaahAI - AI-Powered Student Leadership & Career Companion

**RaahAI** is an advanced, AI-powered student leadership and career intelligence platform designed specifically for Pakistani students. Instead of a simple chatbot, RaahAI acts as a personalized mentor, helping students identify suitable career paths, discover scholarships and internships, develop leadership skills, organize growth roadmaps, and build strong professional brands.

---

## 🌟 Key Features

1. **🧠 Growth DNA Analyzer**
   - Interactive self-assessment to discover your strengths, interests, and career personality.
   - Tailored feedback mapping your personality to Pakistan's evolving job market.

2. **💼 Opportunity Hub & AI Recommender**
   - Aggregates and personalizes internships, fellowships, and scholarships.
   - Instantly matches opportunities against your Profile and Growth DNA.

3. **💬 Raahbar (AI Mentor Chat)**
   - A multi-agent conversational buddy powered by Google Gemini.
   - Provides instant mentorship in both English and Urdu (Roman Urdu friendly!).

4. **📚 Structured Learning & Roadmaps**
   - Curated high-impact modern courses (AI, Tech, Marketing, Leadership).
   - Daily progress tracker backed by client-side persistence.

5. **✨ Brand Builder**
   - Generates professional LinkedIn posts, bios, READMEs, and cold outreach scripts.
   - Features customized AI templates for Pakistani student contexts.

6. **👥 Smart Networking (CRM)**
   - Manage and track your informational interviews, mentors, and connection requests.

7. **📝 Profile & App Feedback**
   - Personalized onboarding where users specify their goals.
   - Core interactive feedback widget saving 5-star ratings and comments directly to **Firebase Firestore**.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, TypeScript
- **Routing:** TanStack Router
- **State & Data Fetching:** TanStack Query (React Query)
- **Database & Auth:** Firebase (Firestore & Authentication)
- **AI Engine:** Google Gemini Pro API / Vertex AI (Server-Side Proxy)
- **UI Components:** Framer Motion (Animations), Lucide React (Icons), Radix UI, Tailwind CSS

---

## 📦 How to Run Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** or **bun** installed on your system.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (From Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` or the port shown in terminal.

---

## 🚀 How to Deploy on Vercel (Step-by-Step Guide)

Vercel par deploy karne ke do tareeqe hain. Sabse behtar aur aasan tareeqa **GitHub** ke zariye hai.

### Option A: GitHub ke Zariye (Recommended & Auto-Deploy) ⭐

1. **Export the Code:**
   - Google AI Studio ke top-right ya Settings menu se **"Export to GitHub"** par click karein.
   - Ya phir code ka **ZIP** download karke apne computer par extract karein aur use ek naye GitHub Repository me push karein.

2. **Vercel Account Banayein:**
   - [Vercel](https://vercel.com) par jayein aur **Sign Up** karein.
   - **"Continue with GitHub"** select karein taake aapka GitHub account connect ho jaye.

3. **Import Project:**
   - Dashboard par **"Add New..."** -> **"Project"** par click karein.
   - Aapke GitHub projects ki list samne aayegi. **RaahAI** repository ke samne **"Import"** par click karein.

4. **Configure Project Settings:**
   - **Framework Preset:** Vercel khud hi **Vite** detect kar lega.
   - **Root Directory:** `./` (Default)
   - **Build Command:** `npm run build` (Default)
   - **Output Directory:** `dist` (Default)

5. **Add Environment Variables (Bohat Zaroori!):**
   - Settings me **Environment Variables** ka section hoga.
   - Apne `.env` file wale tamam keys aur unki values wahan enter karein (Jaise `GEMINI_API_KEY`, `VITE_FIREBASE_API_KEY` wagera).

6. **Deploy:**
   - **"Deploy"** button par click karein. 2 minutes me aapki website live ho jayegi!
   - Iska faida yeh hai ke jab bhi aap GitHub par new code push karenge, Vercel automatic website ko update kar dega.

---

### Option B: Vercel CLI ke Zariye (Bina GitHub ke, Direct Computer se)

Agar aap GitHub use nahi karna chahte aur direct upload karna chahte hain:

1. Apne computer par Google AI Studio se exported **ZIP file extract** karein.
2. Terminal (Command Prompt) open karein aur us folder ke andar jayein.
3. Vercel CLI install karein:
   ```bash
   npm install -g vercel
   ```
4. Login karein:
   ```bash
   vercel login
   ```
5. Deploy command run karein aur simple steps follow karein:
   ```bash
   vercel
   ```
6. Setup ke doran environment variables add karna na bhoolein. Akhir me production build ke liye ye command run karein:
   ```bash
   vercel --prod
   ```

---

## 📜 Project Structure

```
├── public/                 # Static assets (logos, images)
├── src/
│   ├── components/         # Shared UI Components (PageHeader, ThemeProvider, etc.)
│   │   └── ui/             # shadcn based base components
│   ├── lib/                # Utility modules (firebase.ts, ai.functions.ts)
│   ├── routes/             # App routing and page screens
│   │   ├── _authenticated/ # Protected pages (Learning, Brand, Projects, Profile, etc.)
│   │   ├── auth/           # Login and Signup screens
│   │   └── index.tsx       # Landing page / Home
│   ├── App.tsx             # Root layout and providers
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles and Tailwind directives
├── package.json            # Scripts & dependencies configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler setup
└── vercel.json             # Single Page Application (SPA) routing for Vercel
```

---

*Made for Pakistani students with 💚 to foster youth leadership and career progression.*
