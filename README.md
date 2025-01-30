# EduConnect - Collaborative Study Platform

EduConnect is a collaborative study platform that connects students, tutors, and admins to create, manage, and interact with study sessions, materials, and notes. The platform includes authentication, role-based dashboards, session management, and more.

## Features

- **Authentication:**
  - JWT-based authentication for secure access.
  - Social login support (Google, Facebook, etc.).
  
- **User Roles:**
  - **Admin:** Manage users, approve/reject sessions, and assign roles.
  - **Tutor:** Create and manage sessions, upload materials, and provide feedback.
  - **Student:** Join sessions, access materials, and post notes.

- **Session Management:**
  - Create and manage study sessions with details like duration, start/end dates, and more.
  - Approve or reject sessions as an admin.
  - Book sessions as a student.

- **Material Management:**
  - Upload and manage materials for sessions (Tutors only).
  - Access materials for specific sessions.

- **Notes:**
  - Students can post notes related to sessions.

- **Real-time Notifications:**
  - Notifications for successful actions like session booking, material uploads, and role assignments.

## Technologies Used

- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Payment Gateway:** Stripe (for session payments)
- **Authentication:** JWT, Cookie-based authentication
- **Environment Management:** dotenv


