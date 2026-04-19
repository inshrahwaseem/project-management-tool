<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</div>

<h1 align="center">ProFlow - Next-Generation Project Management Tool</h1>

<p align="center">
  A highly scalable, modern, and intuitive Project Management application built to mirror the core functionalities of Jira & Asana. 
  <br />
  <strong><a href="https://project-management-tool-zt8zqfj6k-inshrahwaseems-projects.vercel.app">🔴 Live Demo (Vercel)</a></strong>
</p>

## ✨ Features

- **Modern Dark Theming**: Professionally crafted UI using a strict 60-30-10 Slate/Indigo/Green color palette with glassmorphic elements and clean aesthetics.
- **Workflow Automations**: Intelligent trigger-action rules engine (e.g., auto-assign users when a task status moves to "In Progress").
- **Real-Time Collaboration Chat**: Seamless project-specific messaging using advanced HTTP polling and optimistic UI updates for zero-latency feel without heavy websockets.
- **Dynamic Task Board**: Full Kanban board implementation with drag-and-drop capability.
- **Project Templates**: Auto-populate projects with industry-standard workflow templates (Agile, Bug Tracking, Marketing).

## 📸 Application Demo

Witness the stunning dark mode interface, responsive sidebar navigation, real-time workflow automations, and immediate team chat functionality:

<br />

![ProFlow Demo Recording](./docs/demo-recording.webp)

## 🛠️ Technology Stack

- **Frontend Core**: Next.js 14 API Routes + App Router, React Server Components.
- **Styling**: Tailwind CSS v4, Framer Motion for premium micro-interactions.
- **Backend & Database**: Neon Serverless PostgreSQL Database managed via Prisma ORM.
- **State Management**: Zustand for global UI state & task management optimizations.
- **Authentication**: NextAuth.js (Auth.js) with bcrypt credential integration.

## 🚀 Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/inshrahwaseem/project-management-tool.git

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Important: Update DATABASE_URL with a valid PostgreSQL string!

# 4. Initialize Database
npx prisma db push

# 5. Start development server
npm run dev
```

---

<p align="center">
  Crafted meticulously for modern Engineering workflows.
</p>
