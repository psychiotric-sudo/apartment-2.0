# AptManager 🏢

### Premium Apartment Finance & Resident Management System

AptManager is a high-end, responsive web application designed to streamline apartment management. Built with a "Glassmorphism" aesthetic, it offers a professional "Statement of Account" experience for residents and robust financial tools for administrators.

---

## ✨ Key Features

### 🛡️ For Administrators

- **Real-time Management:** Add, edit, or remove residents with ease.
- **Smart Debt Creation:** Log expenses (Rent, Meals, Utilities) with built-in split-logic and rounding options.
- **Instant Payments:** Record Cash or GCash payments with optimistic UI updates.
- **System Safeguards:**
  - **Undo Last Action:** Instantly revert the most recent transaction across the system.
  - **Repair Integrity:** Automatic cleanup of orphaned records.
  - **Wipe History:** Strict "CONFIRM" protocol for clearing individual or global history.
- **Data Export:** Download a complete JSON backup of your database records.

### 👤 For residents

- **Personal Statement:** A premium, timeline-based view of all past debts and payments.
- **Collapsible History:** Transactions grouped by month in interactive dropdowns.
- **High Readability:** Large calendar-style date indicators for quick reference.
- **Live Balance:** Real-time tracking of current outstanding balance.

### 🚀 Technical Excellence

- **Ultra-Snappy Performance:** Optimistic Auth and background synchronization make the app feel instant.
- **Progressive Web App (PWA):** Installable on mobile/desktop with offline asset caching.
- **Background Notifications:** Real-time alerts for new debts or confirmed payments even when the tab is in the background.
- **Modern UI:** Features the **Outfit** font, shimmering skeleton loaders, and tactile microinteractions.
- **Dual-Theme:** Fully functional Dark and Light modes with persistent user preference.

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime + Auth)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Typography:** [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts
- **Styling:** Modern Vanilla CSS (Custom Glassmorphism framework)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
C
cd apartment-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional for local cleanup scripts)
```

### 4. Database Setup

Run the SQL found in `SUPABASE_FINAL.sql` within your Supabase SQL Editor to scaffold the tables, RLS policies, and triggers.

### 5. Run Locally

```bash
npm run dev
```

---

## 📦 Deployment (Vercel)

This project is optimized for **Vercel**:

1.  Connect your GitHub repository to Vercel.
2.  Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in the Vercel project settings.
3.  Deploy!

---

## 👨‍💻 Developer

Developed with ❤️ by [**@chqrlzz**](https://facebook.com/chqrlzz).

---

## 📄 License

This project is for private use. All rights reserved.
