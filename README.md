<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Gemini-8E75C2?style=for-the-badge&logo=google-gemini" alt="Gemini AI" />
</div>

<h1 align="center">ProFlow - The Enterprise-Grade Project Management Engine</h1>

<p align="center">
  A high-scale, AI-powered Project Management application built for modern engineering teams. ProFlow mirrors the depth of Jira with the sleek aesthetics of Linear, featuring real-time collaboration, workflow automation, and deep analytics.
  <br />
  <strong><a href="https://proflow-project-ui.vercel.app">🔴 Live Demo (Vercel)</a></strong>
</p>

## 🚀 Key Enterprise Features

### 🤖 1. AI Integration (Powered by Gemini)
- **Smart Task Breakdowns**: One-click generation of actionable sub-tasks from high-level descriptions.
- **Bottleneck Detection**: AI-driven analysis of project velocity to identify stalled workflows before they become blockers.
- **Deadline Suggestions**: Intelligent estimation of completion dates based on task complexity.

### 📊 2. Premium Analytics & Dashboards
- **Velocity Tracking**: Detailed AreaCharts visualizing "Tasks Created vs. Completed" over time.
- **Team Performance**: Real-time stats on sprint progress, completion percentages, and productivity trends.
- **Audit Trails**: Full transparency with chronological activity logs showing every status move, comment, and update.

### 📎 3. Cloud File Management
- **Supabase Integration**: Secure, direct-to-cloud file uploads for task attachments.
- **Drag & Drop**: Modern, intuitive upload interface with support for PDFs, images, and documents.
- **Metadata Sync**: Instant persistence of file data within the PostgreSQL ecosystem.

### 🛠️ 4. Workflow Automations & Customization
- **Logic Engine**: Create rules like "When status moves to QA, auto-assign to [Lead Developer]".
- **Custom Fields**: Tailor tasks to your team's needs with dynamic key-value fields (e.g., Cost, Browser, Priority).
- **Interactive Timeline**: A professional Gantt view with real-time progress indicators.

### 📱 5. Modern PWA Support
- **Mobile Native Feel**: Installable on iOS, Android, and Desktop via Progressive Web App technology.
- **Offline Readiness**: Service Worker integration for high-performance loading and native-like Shell.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack, Server Components).
- **Styling**: Tailwind CSS v4, Framer Motion for high-end micro-interactions.
- **Database & ORM**: Neon Serverless PostgreSQL + Prisma.
- **Storage**: Supabase Storage for enterprise file handling.
- **AI**: Google Generative AI (Gemini Flash 1.5).
- **State Management**: Zustand (Optimistic UI updates).
- **Auth**: NextAuth.js (Auth.js) with secure Credential providers.

## ⚙️ Setup & Deployment

### Environment Variables
Create a `.env` file based on the provided enterprise template:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
SLACK_WEBHOOK_URL="..."
```

### Installation
```bash
# Clone
git clone https://github.com/inshrahwaseem/project-management-tool.git

# Install
npm install

# Database Sync & Client Generation
npx prisma db push

# Start (Development)
npm run dev
```

---

<p align="center">
  Created with ❤️ by <strong>Inshrah Waseem</strong> for High-Performance Teams.
</p>
