USE learnhub_db;

-- All sample users use the password: Password123!
-- Replace the hash only if you choose a different default password.
SET @password_hash = '$2b$10$BfToyXvaxlWouNXenDzBf.Usq8zWDvZx0xLYYtUKwT3LO.N56crXy';

INSERT INTO users (id, full_name, email, phone, password, role) VALUES
(1, 'Admin User', 'admin@learnhub.test', '+256700000001', @password_hash, 'admin'),
(2, 'Grace Namatovu', 'grace.teacher@learnhub.test', '+256700000002', @password_hash, 'teacher'),
(3, 'Daniel Okello', 'daniel.teacher@learnhub.test', '+256700000003', @password_hash, 'teacher'),
(4, 'Amina Kato', 'amina.teacher@learnhub.test', '+256700000004', @password_hash, 'teacher'),
(5, 'Brian Ssemanda', 'brian.student@learnhub.test', '+256700000005', @password_hash, 'student'),
(6, 'Claire Atim', 'claire.student@learnhub.test', '+256700000006', @password_hash, 'student'),
(7, 'David Mugisha', 'david.student@learnhub.test', '+256700000007', @password_hash, 'student'),
(8, 'Esther Nakayiza', 'esther.student@learnhub.test', '+256700000008', @password_hash, 'student'),
(9, 'Faith Namugerwa', 'faith.student@learnhub.test', '+256700000009', @password_hash, 'student'),
(10, 'Isaac Ocen', 'isaac.student@learnhub.test', '+256700000010', @password_hash, 'student'),
(11, 'Joan Akello', 'joan.student@learnhub.test', '+256700000011', @password_hash, 'student'),
(12, 'Peter Waiswa', 'peter.student@learnhub.test', '+256700000012', @password_hash, 'student');

INSERT INTO course_categories (id, name, description) VALUES
(1, 'Web Development', 'Frontend and backend web application development.'),
(2, 'Programming', 'Programming foundations and problem solving.'),
(3, 'Database Systems', 'Database design, SQL, and data modeling.'),
(4, 'Networking', 'Computer networking concepts and administration.'),
(5, 'Data Science', 'Data analysis, visualization, and machine learning basics.'),
(6, 'Cybersecurity', 'Security fundamentals and safe system design.');

INSERT INTO courses (id, teacher_id, category_id, title, description, level, duration) VALUES
(1, 2, 1, 'Full-Stack Web Development with JavaScript', 'Build complete web applications with React, Express, and MariaDB.', 'Beginner', '10 weeks'),
(2, 2, 1, 'Responsive Frontend Design', 'Create mobile-friendly user interfaces using React and Bootstrap.', 'Beginner', '6 weeks'),
(3, 3, 2, 'Programming Fundamentals in JavaScript', 'Learn variables, functions, arrays, objects, and control flow.', 'Beginner', '8 weeks'),
(4, 3, 3, 'SQL and Relational Database Design', 'Design normalized schemas and write practical SQL queries.', 'Intermediate', '8 weeks'),
(5, 4, 4, 'Computer Networking Basics', 'Understand IP addressing, routing, DNS, and network troubleshooting.', 'Beginner', '7 weeks'),
(6, 4, 6, 'Cybersecurity Essentials', 'Learn authentication, access control, hashing, and secure habits.', 'Beginner', '6 weeks'),
(7, 2, 5, 'Data Analysis with Spreadsheets and SQL', 'Explore datasets using spreadsheet formulas and SQL queries.', 'Intermediate', '5 weeks'),
(8, 3, 1, 'Backend APIs with Express', 'Create REST APIs with Express, JWT, uploads, and database queries.', 'Intermediate', '8 weeks');

INSERT INTO lessons (id, course_id, title, content, lesson_order) VALUES
(1, 1, 'How the Web Works', 'Clients send HTTP requests to servers, and servers return responses.', 1),
(2, 1, 'React and Express Project Structure', 'Separate frontend components from backend routes and controllers.', 2),
(3, 2, 'Bootstrap Layouts', 'Use containers, rows, columns, and utility classes to create responsive layouts.', 1),
(4, 3, 'Variables and Data Types', 'Use let and const to store values in JavaScript.', 1),
(5, 4, 'Tables and Relationships', 'Use primary keys and foreign keys to model relationships.', 1),
(6, 5, 'IP Addresses and Subnets', 'Networks use IP addresses to identify devices.', 1),
(7, 6, 'Password Hashing', 'Never store plain text passwords. Store a secure hash instead.', 1),
(8, 7, 'Cleaning Data', 'Prepare data before analysis by removing errors and duplicates.', 1),
(9, 8, 'REST API Basics', 'Use routes and HTTP methods to organize API behavior.', 1),
(10, 8, 'JWT Authentication', 'JWTs let the frontend prove who the current user is on protected requests.', 2);

INSERT INTO assignments (id, course_id, teacher_id, title, instructions, due_date, total_marks) VALUES
(1, 1, 2, 'Build a Course Card Component', 'Create a reusable React component that displays course details.', '2026-07-15', 100),
(2, 3, 3, 'JavaScript Practice Problems', 'Solve ten basic problems using functions and arrays.', '2026-07-10', 50),
(3, 4, 3, 'Design a Library Database', 'Create tables for books, authors, members, and loans.', '2026-07-18', 100),
(4, 6, 4, 'Secure Login Review', 'Explain how hashing and JWTs protect user accounts.', '2026-07-20', 80),
(5, 8, 3, 'Create an Express Route', 'Build a protected Express route that reads records from the database.', '2026-07-25', 100);

INSERT INTO enrollments (id, student_id, course_id, progress_percentage) VALUES
(1, 5, 1, 40),
(2, 6, 1, 20),
(3, 7, 3, 65),
(4, 8, 4, 35),
(5, 9, 6, 10),
(6, 10, 8, 55),
(7, 11, 2, 15),
(8, 12, 5, 25),
(9, 5, 8, 30),
(10, 6, 7, 45);

INSERT INTO submissions (assignment_id, student_id, file_path, comments, marks_awarded, feedback, status, graded_at) VALUES
(1, 5, 'uploads/submissions/sample-course-card.pdf', 'Submitted my first version.', 82, 'Good structure. Improve spacing on small screens.', 'graded', CURRENT_TIMESTAMP),
(1, 6, 'uploads/submissions/sample-course-card-2.pdf', 'Please review the card layout.', NULL, NULL, 'submitted', NULL),
(2, 7, 'uploads/submissions/js-practice.pdf', 'All questions attempted.', 45, 'Clear answers and good function names.', 'graded', CURRENT_TIMESTAMP),
(5, 10, 'uploads/submissions/express-route.pdf', 'Route, middleware, and controller included.', 76, 'Works well. Add more validation.', 'graded', CURRENT_TIMESTAMP);
