# LearnHub Backend

LearnHub Backend is a beginner-friendly REST API for an eLearning platform. It is built with Node.js, Express, MariaDB/MySQL, JWT authentication, bcrypt password hashing, and Multer file uploads.

This backend is one separate repository/project folder. The React frontend lives in the separate `learnhub-frontend` folder.

## What This Backend Does

- Registers and logs in users.
- Protects routes with JWT tokens.
- Supports three roles: `admin`, `teacher`, and `student`.
- Lets teachers create courses, lessons, materials, and assignments.
- Lets students enroll in courses, view lessons, submit assignments, and see grades.
- Lets admins manage users, courses, categories, and statistics.
- Stores all real application data in MariaDB/MySQL.

## Tech Stack

- Node.js
- Express.js
- MariaDB/MySQL
- `mysql2/promise`
- JSON Web Tokens with `jsonwebtoken`
- Password hashing with `bcrypt`
- File uploads with `multer`
- CORS with `cors`
- Environment variables with `dotenv`

## Requirements

Install these before running the project:

- Node.js 18 or newer
- npm
- MariaDB or MySQL
- A database user. For this local setup, the project uses:

```text
DB_USER=root
DB_PASSWORD=root
```

If your local MySQL root password is different, update `.env`.

## Folder Structure

```text
learnhub-backend/
  config/              Database connection setup
  controllers/         Request logic and SQL queries
  middleware/          Auth, role checks, and file upload middleware
  routes/              API route definitions
  uploads/materials/   Lesson materials and assignment attachments
  uploads/submissions/ Student submission files
  database/schema.sql  Creates tables and relationships
  database/seed.sql    Adds sample data
  server.js            Express app entry point
```

## First-Time Setup

From inside `learnhub-backend`:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

The local `.env` should look like this for root/root MariaDB:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=learnhub_db
JWT_SECRET=learnhub_local_development_secret_change_before_production
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Create and Seed the Database

Run these commands from inside `learnhub-backend`:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

When prompted for the password, enter:

```text
root
```

`schema.sql` creates the `learnhub_db` database and all tables. `seed.sql` inserts sample users, categories, courses, lessons, assignments, enrollments, and submissions.

## Run the Backend

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The API runs at:

```text
http://localhost:5000
```

Quick health check:

```bash
curl http://localhost:5000/
```

Expected response:

```json
{"message":"LearnHub API is running."}
```

## Default Login Accounts

All seeded users use this password:

```text
Password123!
```

| Role | Email |
| --- | --- |
| Admin | `admin@learnhub.test` |
| Teacher | `grace.teacher@learnhub.test` |
| Student | `brian.student@learnhub.test` |

## How to See the Data

### Option 1: Use MariaDB/MySQL CLI

Open the database:

```bash
mysql -u root -p learnhub_db
```

Enter password:

```text
root
```

Useful queries:

```sql
SHOW TABLES;

SELECT id, full_name, email, role, status FROM users;

SELECT c.id, c.title, u.full_name AS teacher, cat.name AS category, c.status
FROM courses c
JOIN users u ON u.id = c.teacher_id
LEFT JOIN course_categories cat ON cat.id = c.category_id;

SELECT e.id, s.full_name AS student, c.title AS course, e.progress_percentage
FROM enrollments e
JOIN users s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id;

SELECT s.id, u.full_name AS student, a.title AS assignment, s.marks_awarded, s.feedback, s.status
FROM submissions s
JOIN users u ON u.id = s.student_id
JOIN assignments a ON a.id = s.assignment_id;
```

Exit MySQL:

```sql
EXIT;
```

### Option 2: Use MySQL Workbench, DBeaver, or phpMyAdmin

Connect with:

```text
Host: localhost
User: root
Password: root
Database: learnhub_db
```

Then open these tables:

- `users`
- `course_categories`
- `courses`
- `lessons`
- `lesson_materials`
- `enrollments`
- `assignments`
- `submissions`

### Option 3: Use API Endpoints

Public course data:

```bash
curl http://localhost:5000/api/courses
```

Login and copy the token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learnhub.test","password":"Password123!"}'
```

Use the token for protected routes:

```bash
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Authentication Explained

1. A user logs in with email and password.
2. The backend compares the password with the bcrypt hash stored in `users.password`.
3. If the password is correct, the backend creates a JWT.
4. The frontend stores that JWT in `localStorage`.
5. Protected API requests send the token in the `Authorization` header.
6. `authMiddleware.js` verifies the token and adds the decoded user to `req.user`.

Example protected request header:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

## Role-Based Access Explained

`roleMiddleware.js` checks whether the logged-in user has the required role.

Examples:

- Students can enroll in courses and submit assignments.
- Teachers can create courses, lessons, and assignments.
- Teachers can only edit their own course records.
- Admins can view and manage all platform records.

Controller functions also check ownership. This is important because role checks alone are not enough. A teacher role should not allow editing another teacher's course.

## File Uploads Explained

Multer handles uploaded files.

- Lesson materials and assignment attachments are saved to `uploads/materials`.
- Student assignment submissions are saved to `uploads/submissions`.

The backend serves the `uploads` folder publicly:

```text
http://localhost:5000/uploads/materials/example.pdf
http://localhost:5000/uploads/submissions/example.pdf
```

## CORS Setup

CORS is configured in `server.js`. The default allowed origins are:

```text
http://localhost:5173
http://127.0.0.1:5173
```

This avoids common browser errors when Vite opens the frontend with `127.0.0.1` but the backend expects `localhost`.

To add more frontend URLs, update `CORS_ORIGINS` in `.env`:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

## Main API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Courses

- `GET /api/courses`
- `GET /api/courses/categories`
- `GET /api/courses/:id`
- `GET /api/courses/teacher/my-courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`

### Lessons

- `POST /api/lessons`
- `GET /api/lessons/course/:courseId`
- `GET /api/lessons/:id`
- `PUT /api/lessons/:id`
- `DELETE /api/lessons/:id`

### Enrollments

- `POST /api/enrollments/:courseId`
- `GET /api/enrollments/my-courses`
- `GET /api/enrollments/course/:courseId`
- `PUT /api/enrollments/:id/progress`

### Assignments

- `POST /api/assignments`
- `GET /api/assignments/course/:courseId`
- `GET /api/assignments/:id`
- `PUT /api/assignments/:id`
- `DELETE /api/assignments/:id`

### Submissions

- `POST /api/submissions/:assignmentId`
- `GET /api/submissions/my-submissions`
- `GET /api/submissions/assignment/:assignmentId`
- `PUT /api/submissions/:id/grade`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/courses`
- `PUT /api/admin/users/:id/status`
- `PUT /api/admin/courses/:id/status`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`

## Common Problems

### Access denied for user root

Your MySQL password is not `root`, or root login is disabled. Update `.env` and rerun commands with the correct credentials.

### Database does not exist

Run:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### CORS error in browser

Make sure the backend is running and that `.env` includes the frontend URL in `CORS_ORIGINS`.

### Login fails for seeded users

Make sure `database/seed.sql` was imported after `database/schema.sql`.
