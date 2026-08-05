# Employee Tracking System (ETS)

A modern, high-fidelity Employee Tracking & Project Reporting workspace built with **React 19**, **TypeScript**, **Vite**, and **TailwindCSS v4**. The application features role-based access controls, interactive metrics tracking, client requirement tracing, and real-time visualization of work hours.

---

## 📖 Overview

The Employee Tracking System (ETS) is designed to streamline resource allocation, trace tasks to raw client-submitted requirements, and log employee working/break hours for project analytical reporting. It provides customized experiences for different organizational roles:
*   **Administrators (Sarah Connor):** Manage workspace personnel, mapping system users, roles, and supervisor links.
*   **Managers / Project Managers (Marcus Wright, Elena Rostova):** Maintain project scope items, input and approve client requirements, and review task allocations.
*   **Employees (John Connor):** Log daily work schedules, status indicators (To Do → In Progress → Review → Finished), and verify tasks.

---

## 🏗️ Project Architecture & Construction

The system is constructed as a clean, modular single-page React application (SPA).

### 🛠️ Tech Stack
*   **Core Framework:** React 19 (Functional Components with hooks)
*   **Language:** TypeScript
*   **Build Tool:** Vite 8 (Hot Module Replacement enabled)
*   **Styling:** TailwindCSS v4 with `@tailwindcss/postcss` for compilation and CSS utility classes
*   **Routing:** React Router v7 (`react-router-dom` with `createBrowserRouter`)
*   **Icons:** Lucide React
*   **HTTP Client:** Axios (configured with interceptors)

### 📂 Directory Structure

The workspace follows a feature-driven, layered directory design:

```
├── .env.example            # Template for environment configuration
├── eslint.config.js        # Linting rules configuration
├── package.json            # Scripts, dependency libraries, and metadata
├── postcss.config.js       # PostCSS styling configurations
├── tailwind.config.js      # Utility class customizations and themes
├── tsconfig.json           # Root TypeScript configuration
├── vite.config.ts          # Vite build plugin definitions
├── src/                    # Source directory containing all app code
│   ├── App.tsx             # Root Application Component
│   ├── index.css           # Global CSS and custom styles
│   ├── main.tsx            # DOM Entry Point
│   ├── assets/             # Images, logos, and static resources
│   ├── components/         # Shared application components
│   │   ├── Navbar.tsx      # Floating glassmorphic top navigation bar
│   │   ├── Sidebar.tsx     # Collapsible sidebar containing page routes
│   │   └── ui/             # Reusable Shadcn-style components (Buttons, Modals, Cards, Tables, etc.)
│   ├── constants/          # Application-wide static options, configs, status/priority styles
│   ├── hooks/              # Custom React Hooks (useAuth, useTheme, index exports)
│   ├── layouts/            # Layout shells (DashboardLayout for sidebar/navbar structure)
│   ├── pages/              # Individual module page views:
│   │   ├── Dashboard.tsx   # Core summary analytics, time tracking chart, active project list
│   │   ├── Employees.tsx   # Admin-restricted directory
│   │   ├── Projects.tsx    # Manager-restricted project tracker list
│   │   ├── Requirements.tsx# Functional specifications logging dashboard
│   │   ├── Tasks.tsx       # State workflow status tracking board
│   │   ├── Reports.tsx     # CSV, PDF, and spreadsheet export configurations
│   │   ├── Settings.tsx    # User preference and profile details screen
│   │   ├── Login.tsx       # Dynamic mock gateway & session access page
│   │   └── NotFound.tsx    # Fallback error screen for invalid route matching
│   ├── routes/             # Client-side routing mappings and RoleGuard navigation interceptors
│   ├── services/           # Api client configurations & Axios interceptor handlers
│   ├── types/              # System-wide TypeScript type declarations and interfaces
│   └── utils/              # Data parsing, date styling, CSS merging, CSV/PDF export utilities
```

---

## ⚙️ How the Tracker Works (Core Mechanics)

### 1. Role-Based Access Control (RBAC)
Authorization limits view capabilities and route navigation using the `RoleGuard` component defined in [routes/index.tsx](file:///src/routes/index.tsx). 
*   If a user tries to access a page they are not authorized for (e.g. an `EMPLOYEE` trying to access `/employees`), they are automatically redirected back to `/dashboard`.
*   Authentication is configured through standard React Context in [hooks/useAuth.tsx](file:///src/hooks/useAuth.tsx). On initial mount, if no JWT token is stored, it defaults to auto-login as `ADMIN` for local testing/development convenience.

### 2. Visual Time Tracker
The dashboard includes an interactive visual bar chart representing hours spent over the last 5 weeks:
*   **Work Hours:** Standard product development time (rendered as primary text color).
*   **Break Hours:** Casual breaks (rendered as muted gray color).
*   **Lunch Hours:** Mandatory lunch allocations (rendered as semi-transparent highlights).
*   Hovering over any segment displays exact tooltips indicating logged decimal hours (e.g. `Work: 8.5h`). Data is dynamically calculated using standard Javascript array aggregations.

### 3. Requirements & Task Traceability
To ensure all work is justified by product scope:
*   Tasks are linked directly to parent requirement codes (e.g., `FR-09: Secure Endpoints`) in [pages/Dashboard.tsx](file:///src/pages/Dashboard.tsx).
*   This links individual implementation details (like `TSK-102`: *Implement Client JWT Authorization*) directly to client-facing functional requirements, allowing managers to monitor development tracing.

### 4. API Service & Authentication Interceptors
The communication layer in [services/api.ts](file:///src/services/api.ts) relies on Axios:
*   **Request Interceptor:** Automatically extracts the client auth JWT token from `localStorage` and appends it to the header as `Authorization: Bearer <token>` for all outgoing HTTP requests.
*   **Response Interceptor:** Inspects incoming error codes. If a `401 Unauthorized` status is received, it automatically wipes invalid tokens from storage and broadcasts the `auth:unauthorized` event to reset user sessions reactively.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
*   Node.js (v18.x or newer recommended)
*   npm or yarn

### Installation
1. Clone the project repository.
2. Open terminal in the project directory and install application packages:
   ```bash
   npm install
   ```

### Configuration Setup
Create a `.env` file at the root of the project by copying the example file:
```bash
cp .env.example .env
```
Inside `.env`, verify or customize the required fields:
*   `VITE_APP_NAME`: Name of your localized instance.
*   `VITE_API_URL`: Root path of the target backend service api.

### Local Development Server
Launch the live development server:
```bash
npm run dev
```
The console will display the local port (usually `http://localhost:5173/`).

### Building for Production
To bundle optimized, static production files into the `dist/` directory:
```bash
npm run build
```
Verify the build production bundle locally using:
```bash
npm run preview
```

---

## 🔒 Security Guidelines

*   **No Hardcoded Secrets:** Never store production JSON Web Token secret keys, API passwords, database credentials, or server addresses in the `.env` template or main codebase. Use host environment injectors in production.
*   **Git Security:** The `.env` file is excluded in `.gitignore` to prevent leaking custom dev variables. Never remove `.env` from the ignores list.
*   **Local Storage Safeguard:** Storage keys used for authentication indicators (`ets_auth_token`, `ets_auth_user`) are strictly client-side mock JWT representations during dev mode. Production code should enforce server-verified session cookying or secure OAuth callbacks.
