# Full Stack Integration — Bahadur Ali

A complete full stack Student & Task Management app — DecodeLabs Internship, Project 4.

##  Setup (2 Steps)

### Step 1 — Create database in SSMS
```sql
CREATE DATABASE Project4DB;
```

### Step 2 — Run the server
```bash
npm install
node server.js
```
Open: http://localhost:3000

---

##  What this project does

This is a complete **Student & Task Management System** where the frontend and backend are fully connected:

- **Dashboard** — Live stats from database, recent students and tasks
- **Students** — Add, view, search, edit, delete students
- **Tasks** — Add tasks, assign to students, mark complete, delete

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/status` | Server + DB stats |
| GET/POST | `/api/students` | Get all / Add student |
| GET/PUT/DELETE | `/api/students/:id` | Get / Edit / Delete student |
| GET/POST | `/api/tasks` | Get all / Add task |
| PUT | `/api/tasks/:id/toggle` | Toggle complete |
| DELETE | `/api/tasks/:id` | Delete task |

##  Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (fetch API, async/await)
- **Backend:** Node.js + Express
- **Database:** SQL Server (SSMS, Windows Authentication)

## 👤 Developer
**bahadur ali** | DecodeLabs  | bahadurali34876@gmail.com
