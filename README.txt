# Team Task Manager - Full Stack App

## Live URL
[Add your Railway URL here after deployment]

## Tech Stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React (Create React App)
- Auth: JWT + bcryptjs
- Deployment: Railway

---

## Setup & Run Locally

### 1. Backend
```
cd backend
npm install
cp .env.example .env       # Fill in your DB + JWT secret
node schema.sql             # Or run schema.sql in your PostgreSQL DB
npm start                   # Runs on port 5000
```

### 2. Frontend
```
cd frontend/client
npm install
cp .env.example .env       # Set REACT_APP_API_URL=http://localhost:5000
npm start                   # Runs on port 3000
```

---

## Railway Deployment

### Backend:
1. Create a new Railway project
2. Add a PostgreSQL plugin – copy the DATABASE_URL
3. Set environment variables:
   - DATABASE_URL = (from Railway PostgreSQL)
   - JWT_SECRET = (any long random string)
   - NODE_ENV = production
   - CLIENT_URL = (your frontend Railway URL)
4. Deploy backend folder as a service
5. Run schema.sql once via Railway's DB console or psql

### Frontend:
1. Add another service in same Railway project
2. Set environment variable:
   - REACT_APP_API_URL = (your backend Railway URL)
3. Deploy frontend/client folder
4. Set build command: npm run build
5. Set start command: npx serve -s build

---

## Features

### Authentication
- Signup with name, email, password, role (admin/member)
- Login returns JWT token stored in localStorage
- All API routes protected via Bearer token

### Role-Based Access Control
- Admin: Create/delete projects, create tasks, assign to members, update any task
- Member: View projects, view tasks, update status of assigned tasks only

### Projects
- Create, view, delete projects (admin)
- Each project links to its tasks

### Tasks
- Create tasks with title, description, assignee, due date (admin)
- Update task status: todo → in_progress → done
- Overdue detection (due_date < now and not done)

### Dashboard
- Stats: total / todo / in-progress / done / overdue task counts
- Project list sidebar
- Task board grouped by status (To Do, In Progress, Done)
- Recent tasks overview

---

## API Endpoints

### Auth
POST /api/auth/signup     - Register user
POST /api/auth/login      - Login, returns JWT
GET  /api/auth/users      - List all users (admin only)

### Projects (requires Bearer token)
GET    /api/projects      - List all projects
POST   /api/projects      - Create project (admin)
GET    /api/projects/:id  - Get project details
DELETE /api/projects/:id  - Delete project (admin)

### Tasks (requires Bearer token)
GET  /api/tasks/dashboard/stats     - Dashboard stats
GET  /api/tasks/project/:id         - Tasks for a project
POST /api/tasks                     - Create task (admin)
PUT  /api/tasks/:id                 - Update task status

---

## Database Schema

users(id, name, email, password, role, created_at)
projects(id, name, description, created_by, created_at)
tasks(id, title, description, project_id, assigned_to, status, due_date, created_at, updated_at)
