<div align="center">
  
  # ProFlow: Enterprise SaaS Project Management Platform

  **A production-ready, AI-enhanced task and project management ecosystem designed for modern teams.**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 🚀 Overview

ProFlow is a comprehensive, enterprise-grade SaaS application engineered to streamline workflows, enhance team collaboration, and provide deep insights into project health. Built from the ground up with a focus on performance, security, and exceptional user experience, this platform demonstrates mastery of modern full-stack web development.

Moving beyond basic task managers, ProFlow incorporates sophisticated features essential for real-world enterprise environments, including real-time synchronization, advanced role-based access control (RBAC), multi-factor authentication (MFA), and automated budget tracking.

---

## 📸 Platform Highlights

<div align="center">

![Dashboard Overview](file:///C:/Users/ELITEBOOK/.gemini/antigravity/brain/208820ee-e055-41d1-b687-2a5210a856e0/dashboard_overview_1777059232711.png)
*Executive Dashboard: High-level overview of team workload, recent activity, and active project health metrics.*

![Kanban Interface](file:///C:/Users/ELITEBOOK/.gemini/antigravity/brain/208820ee-e055-41d1-b687-2a5210a856e0/kanban_board_1777059270075.png)
*Interactive Kanban: Drag-and-drop workflow management with real-time Pusher.js synchronization.*

![Milestone Tracking](file:///C:/Users/ELITEBOOK/.gemini/antigravity/brain/208820ee-e055-41d1-b687-2a5210a856e0/project_milestones_1777059783470.png)
*Milestone Timeline: Track critical project phases, deadlines, and overall progress completion.*

![Budget & Expenses](file:///C:/Users/ELITEBOOK/.gemini/antigravity/brain/208820ee-e055-41d1-b687-2a5210a856e0/budget_expenses_1777059294644.png)
*Financial Analytics: Categorized budget tracking and expense management for project lifecycle cost analysis.*

</div>

---

## 💎 Enterprise-Ready Features

### 🔐 Security & Authentication
- **Multi-Factor Authentication (2FA/TOTP):** Robust account security utilizing `otplib` and QR code generation for authenticator app integration.
- **NextAuth Integration:** Secure, session-based authentication supporting both email/password credentials and OAuth providers.
- **Role-Based Access Control (RBAC):** Granular permissions defining Owner, Admin, and Member capabilities across project scopes.

### 📊 Project & Financial Management
- **Budget & Expense Tracking:** Dedicated financial dashboards to monitor project spending, categorize expenses, and visualize budget consumption via interactive charts.
- **Milestone Management:** Strategic checkpoint tracking with progress visualizations and deadline monitoring.
- **Comprehensive Time Tracking:** Embedded task stopwatches and manual time logs to measure actual vs. estimated effort, automatically updating project analytics.

### ⚡ Real-Time Collaboration & Productivity
- **Live Sync Engine:** Leveraging `pusher-js` and `pusher` server for instant updates across Kanban boards, comments, and notifications without browser refreshes.
- **Workload Analytics:** Capacity planning algorithms that visually flag overloaded team members and distribute tasks efficiently.
- **AI-Powered Assistance:** Integration with AI endpoints to automatically suggest task breakdowns and subtasks based on context.
- **Advanced File Management:** Secure attachment uploads utilizing `UploadThing` with optimized file delivery.

### 🎨 Architecture & UI/UX
- **Optimized Data Layer:** Prisma ORM communicating with a serverless Neon PostgreSQL database, utilizing PostgreSQL Full-Text Search for highly performant, sub-second global queries.
- **Glassmorphic Design System:** A highly polished, responsive, and accessible UI crafted with Tailwind CSS and Framer Motion for buttery-smooth micro-interactions.
- **Type-Safe Full-Stack:** Strict TypeScript enforcement from database schema to React components, ensuring high reliability and zero-runtime-error deployments.

---

## 🛠️ Technical Stack

**Frontend:**
- **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion (Animations), `dnd-kit` (Drag & Drop)
- **State Management:** Zustand
- **Components:** Radix UI (Headless accessibility primitives), Lucide React (Icons)

**Backend:**
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js (v4), `otplib` (for 2FA)
- **Real-time:** Pusher (WebSockets)
- **Storage:** UploadThing
- **Validation:** Zod

---

## ⚙️ Local Development Setup

To run this enterprise application locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/inshrahwaseem/project-management-tool.git
   cd project-management-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Duplicate `.env.example` to `.env` and populate all necessary keys:
   - Database connection string (Neon/PostgreSQL)
   - NextAuth Secret
   - Pusher credentials (App ID, Key, Secret, Cluster)
   - UploadThing Token

4. **Initialize the Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:3000`.*

---

<div align="center">
  <p>Engineered with precision for production scale.</p>
</div>
