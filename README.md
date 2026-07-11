# ▲ TASK.FLOW.

A premium, high-performance productivity and task management web application designed with a stark, modern glassmorphic interface inspired by Vercel's design aesthetics. 

Live Production App: **[https://taskflow-app-five-orpin.vercel.app](https://taskflow-app-five-orpin.vercel.app)**
GitHub Repository: **[https://github.com/saptakgg/taskflow-app](https://github.com/saptakgg/taskflow-app)**

---

## ⚡ Key Features

* **Centralized Command Panel Overlay**: Press `C` or `N` anywhere on the dashboard to open the task creation panel overlay. Close instantly with `Esc`.
* **Visual & NLP Dual Input**: Type parameters directly (e.g. `!high`, `@work`, `tomorrow`) to dynamically highlight values, or use the visual buttons to configure your task parameters.
* **Stat Analytics Panel**: High-fidelity dashboard visualizing completed task ratios, priority distributions, and categories at a single glance.
* **Checklist Subtasks**: Create and manage detailed checkable subtasks within your parent task object.
* **Serverless Backend (PostgreSQL)**: Connected via a Vercel Serverless Function (`/api/todos`) mapping CRUD requests to a Postgres database.
* **Hybrid Storage Sync**: The application connects to your cloud database when online. If the database connection is unconfigured or offline, it seamlessly falls back to browser `localStorage` without interrupting user experience.
* **Visual Status Indicator**: A live connection status badge (`CLOUD` / `LOCAL`) in the header logo dynamically updates based on the database sync status.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), CSS Custom Customizations (Glassmorphism, Dark/Light palettes, fluid animations)
* **Backend**: Vercel Serverless Functions (Node.js)
* **Database**: PostgreSQL (Neon.tech serverless Postgres driver using `pg` and native `JSONB` format for nested subtasks)
* **Linting**: Oxlint (instant 100% clean check)

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/saptakgg/taskflow-app.git
cd taskflow-app
npm install
```

### 2. Configure Your Database (Free Tier)
To persist your tasks in a PostgreSQL cloud database (e.g. [Neon.tech](https://neon.tech/)):
1. Create a free Postgres database on Neon.
2. Create a local `.env` file in the root of this project:
   ```env
   DATABASE_URL=your_postgres_connection_string
   ```

### 3. Local Development
Run Vercel's local dev server to simulate serverless functions alongside the Vite app:
```bash
npx vercel dev
```
*If you are not using the serverless backend, you can run the client-only environment directly via:*
```bash
npm run dev
```

### 4. Build & Production Check
Verify production builds and run oxlint checks:
```bash
npm run lint   # Runs oxlint
npm run build  # Builds production distribution assets
```

---

## ☁️ Deploying to Vercel

The backend functions and frontend are configured for instant deployment to Vercel:

1. Install the Vercel CLI and link your project:
   ```bash
   npx vercel
   ```
2. Add your database connection string to Vercel's environment variables:
   * Key: `DATABASE_URL`
   * Value: `your_postgres_connection_string`
3. Promote to production:
   ```bash
   npx vercel --prod
   ```
