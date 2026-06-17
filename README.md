# LearnHub Backend

LearnHub is a beginner-friendly eLearning API built with Node.js, Express, MariaDB/MySQL, JWT authentication, bcrypt password hashing, and Multer file uploads.

## Tech Stack

- Node.js and Express.js for the HTTP API
- MariaDB/MySQL for persistent data
- `mysql2/promise` for database queries
- JWT for protected routes
- bcrypt for password hashing
- Multer for lesson material and assignment submission uploads

## Folder Structure

- `config/db.js` creates the reusable database connection pool.
- `controllers/` contains request logic and SQL queries.
- `routes/` maps API URLs to controller functions.
- `middleware/` contains authentication, role checks, and upload handling.
- `uploads/materials/` stores lesson materials and assignment attachments.
- `uploads/submissions/` stores student assignment submissions.
- `database/schema.sql` creates the database tables.
- `database/seed.sql` inserts sample users, categories, courses, lessons, assignments, enrollments, and submissions.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your MariaDB/MySQL username, password, database name, and JWT secret.

4. Create and seed the database:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

5. Start the server:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Default Accounts

All default accounts use this password: `Password123!`

- Admin: `admin@learnhub.test`
- Teacher: `grace.teacher@learnhub.test`
- Student: `brian.student@learnhub.test`

## Authentication

When a user logs in, the backend signs a JWT containing the user's `id`, `email`, `full_name`, and `role`. The frontend stores the token in `localStorage` and sends it on protected requests:

```http
Authorization: Bearer YOUR_TOKEN
```

`authMiddleware.js` verifies the token and places the decoded user on `req.user`.

## Role-Based Access Control

`roleMiddleware.js` checks the user's role before a controller runs. For example, students can enroll and submit assignments, teachers can create courses and grade submissions, and admins can manage users and platform records.

Controllers also check record ownership. A teacher can only edit courses, lessons, and assignments that belong to that teacher.

## File Uploads

Multer saves uploaded files to local folders:

- Lesson materials and assignment attachments: `uploads/materials`
- Student submissions: `uploads/submissions`

Files are served from `/uploads`, so a saved path like `uploads/materials/file.pdf` can be downloaded from `http://localhost:5000/uploads/materials/file.pdf`.

## Student Flow

Students browse active courses, enroll through `/api/enrollments/:courseId`, then access lessons and assignments for enrolled courses. Assignment submissions are sent as multipart form data to `/api/submissions/:assignmentId`. Teachers grade submissions with marks and feedback, and students view those results through `/api/submissions/my-submissions`.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Courses

- `GET /api/courses`
- `GET /api/courses/categories`
- `GET /api/courses/:id`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`
- `GET /api/courses/teacher/my-courses`

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
